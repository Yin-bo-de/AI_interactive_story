"""
消息交互API
处理用户消息和AI回复
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
import json
from loguru import logger

from ..services import get_session_service, get_story_service
from ..models.dialogue import DialogueMessage, MessageRole
from ..models.session import SessionStatus


router = APIRouter(prefix="/sessions/{session_id}/messages", tags=["messages"])


# 获取自定义故事服务实例
def _get_custom_story_service(session_id: str):
    """获取自定义故事服务实例"""
    try:
        from .sessions import _custom_story_services
        return _custom_story_services.get(session_id)
    except:
        return None


# 请求/响应模型
class SendMessageRequest(BaseModel):
    """发送消息请求"""
    content: str = Field(..., min_length=1, max_length=1000, description="消息内容")


class SendMessageResponse(BaseModel):
    """发送消息响应"""
    ai_message: str = Field(..., description="AI回复")
    options: list[str] = Field(default_factory=list, description="行动建议")
    new_clue: Optional[str] = Field(None, description="新发现的线索")
    round_number: int = Field(..., description="当前轮次")
    remaining_time: float = Field(..., description="剩余时间（秒）")
    game_over: bool = Field(default=False, description="游戏是否结束")
    ending: Optional[dict[str, Any]] = Field(None, description="游戏结束时的结局")


class GetMessagesResponse(BaseModel):
    """获取消息列表响应"""
    messages: list[dict[str, Any]] = Field(..., description="消息列表")
    total_rounds: int = Field(..., description="总轮次")


class MessageItem(BaseModel):
    """消息项"""
    role: str = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")
    timestamp: str = Field(..., description="消息时间戳")
    options: Optional[list[str]] = Field(None, description="AI提供的选项")


@router.post("/send", response_model=SendMessageResponse)
async def send_message(session_id: str, request: SendMessageRequest):
    """
    发送用户消息并获取AI回复

    处理用户输入，生成AI回复，推进剧情发展
    """
    session_service = get_session_service()
    story_service = get_story_service()

    # 获取会话
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 检查会话状态
    if session.status == SessionStatus.ENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="会话已结束"
        )

    # 检查游戏是否结束
    session.check_game_over()
    if session.status == SessionStatus.ENDED:
        # 游戏时间到，生成结局
        custom_story_service = _get_custom_story_service(session_id) or story_service
        ending = await _generate_game_ending(session, session_service, custom_story_service)
        return SendMessageResponse(
            ai_message="时间到了，让我们来揭晓最终的真相...",
            options=[],
            round_number=session.dialogue_history.total_rounds,
            remaining_time=session.remaining_time,
            game_over=True,
            ending=ending
        )

    try:
        # 添加用户消息到历史
        user_message = DialogueMessage(
            role=MessageRole.USER,
            content=request.content
        )
        session.dialogue_history.add_message(user_message)

        # 获取自定义故事服务实例（如果有）
        custom_story_service = _get_custom_story_service(session_id) or story_service

        # 继续故事，生成AI回复
        result = await custom_story_service.continue_story(session, request.content)

        # 添加AI回复到历史
        ai_message = DialogueMessage(
            role=MessageRole.ASSISTANT,
            content=result["message"],
            options=result.get("options")
        )
        session.dialogue_history.add_message(ai_message)

        # 更新会话
        session.total_messages = len(session.dialogue_history.messages)
        session_service.update_session(session)

        # 检查游戏是否结束
        session.check_game_over()
        game_over = session.status == SessionStatus.ENDED

        # 如果游戏结束，生成结局
        if game_over:
            ending = await _generate_game_ending(session, session_service, custom_story_service)
            return SendMessageResponse(
                ai_message=result["message"],
                options=result.get("options", []),
                new_clue=result.get("new_clue"),
                round_number=session.dialogue_history.total_rounds,
                remaining_time=session.remaining_time,
                game_over=True,
                ending=ending
            )

        return SendMessageResponse(
            ai_message=result["message"],
            options=result.get("options", []),
            new_clue=result.get("new_clue"),
            round_number=session.dialogue_history.total_rounds,
            remaining_time=session.remaining_time,
            game_over=False
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理消息失败: {str(e)}"
        )




@router.get("", response_model=GetMessagesResponse)
async def get_messages(session_id: str):
    """
    获取消息历史

    返回指定会话的所有消息
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 转换消息为响应格式
    messages = []
    for msg in session.dialogue_history.messages:
        messages.append({
            "role": msg.role.value,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat(),
            "options": msg.options
        })

    return GetMessagesResponse(
        messages=messages,
        total_rounds=session.dialogue_history.total_rounds
    )


async def _generate_game_ending(session, session_service, story_service) -> dict[str, Any]:
    """
    生成游戏结局

    Args:
        session: 游戏会话
        session_service: 会话服务
        story_service: 故事服务

    Returns:
        结局字典
    """
    try:
        # 选择最合适的结局
        selected_ending = session.story_state.get_selected_ending()

        # 生成结局内容
        from ..prompts import get_end_prompt

        # 准备角色信息
        characters_info = "\n".join([
            f"- {char.name}: {char.description}"
            for char in session.story_state.characters
        ])

        # 准备线索信息
        key_clues = "\n".join([
            f"- {clue.content}"
            for clue in session.story_state.clues if clue.is_key
        ])

        # 准备玩家行动摘要
        player_actions = session.story_state.context_summary
        if not player_actions:
            player_actions = "玩家进行了多轮对话和探索"

        prompt = get_end_prompt(
            background=session.story_state.background,
            characters_info=characters_info,
            selected_ending=selected_ending.description if selected_ending else "开放式结局",
            player_actions=player_actions,
            key_clues=key_clues,
            total_rounds=session.dialogue_history.total_rounds,
            duration_minutes=session.elapsed_time / 60
        )

        llm_service = story_service.llm_service
        ending_result = await llm_service.call_llm_json(prompt)

        # 确保会话已结束
        session.status = SessionStatus.ENDED
        session.end_time = datetime.now()
        session_service.update_session(session)

        return ending_result

    except Exception as e:
        # 如果生成结局失败，返回默认结局
        return {
            "ending_title": "故事暂告段落",
            "ending_story": f"感谢你的参与！共进行了{session.dialogue_history.total_rounds}轮对话。很遗憾无法生成完整结局，但我们希望你享受了这个故事。",
            "truth_revealed": "真相仍未完全揭晓",
            "clues_explanation": "你发现了一些有趣的线索...",
            "player_evaluation": "你展现了很好的探索精神！",
            "rating": 7.0
        }