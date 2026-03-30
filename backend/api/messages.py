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

from ..services import get_session_service, get_story_service, get_group_chat_service, get_character_service
from ..models.dialogue import DialogueMessage, MessageRole
from ..models.session import SessionStatus
import uuid


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
    id: str = Field(..., description="消息唯一ID")
    role: str = Field(..., description="消息角色")
    sender_id: str = Field(..., description="发送者ID")
    sender_name: str = Field(..., description="发送者名称")
    sender_avatar: Optional[str] = Field(None, description="发送者头像")
    content: str = Field(..., description="消息内容")
    timestamp: str = Field(..., description="消息时间戳")
    options: Optional[list[str]] = Field(None, description="AI提供的选项")
    mentioned_characters: list[str] = Field(default_factory=list, description="@提及的角色ID列表")
    message_type: str = Field(default="text", description="消息类型")


class CharacterItem(BaseModel):
    """角色项"""
    id: str = Field(..., description="角色ID")
    name: str = Field(..., description="角色名称")
    avatar: Optional[str] = Field(None, description="角色头像")
    description: str = Field(..., description="角色描述")
    is_active: bool = Field(..., description="是否活跃")
    priority: int = Field(..., description="角色优先级")


class GroupChatSendResponse(BaseModel):
    """群聊发送消息响应"""
    scheduled_speakers: list[str] = Field(..., description="待发言的角色ID列表")
    round_number: int = Field(..., description="当前轮次")
    remaining_time: float = Field(..., description="剩余时间（秒）")
    game_over: bool = Field(default=False, description="游戏是否结束")
    ending: Optional[dict[str, Any]] = Field(None, description="游戏结束时的结局")


class NextSpeechResponse(BaseModel):
    """获取下一个发言响应"""
    has_next: bool = Field(..., description="是否还有下一个发言")
    message: Optional[dict[str, Any]] = Field(None, description="发言消息")
    next_speaker: Optional[str] = Field(None, description="下一个发言的角色名称")


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
            id=f"msg_{uuid.uuid4().hex[:8]}",
            role=MessageRole.USER,
            sender_id="user",
            sender_name="你",
            sender_avatar=None,
            content=request.content,
            mentioned_characters=[],
            message_type="text"
        )
        session.dialogue_history.add_message(user_message)

        # 获取自定义故事服务实例（如果有）
        custom_story_service = _get_custom_story_service(session_id) or story_service

        # 继续故事，生成AI回复
        result = await custom_story_service.continue_story(session, request.content)

        # 添加AI回复到历史
        main_char = session.story_state.characters[0] if session.story_state.characters else None
        ai_message = DialogueMessage(
            id=f"msg_{uuid.uuid4().hex[:8]}",
            role=MessageRole.ASSISTANT,
            sender_id=main_char.id if main_char else "assistant",
            sender_name=main_char.name if main_char else "侦探",
            sender_avatar=main_char.avatar if main_char else None,
            content=result["message"],
            options=result.get("options"),
            mentioned_characters=[],
            message_type="text"
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

    # 转换消息为响应格式（兼容新旧消息格式）
    messages = []
    for msg in session.dialogue_history.messages:
        # 处理旧版本消息（没有id等字段）
        if not hasattr(msg, 'id') or not msg.id:
            msg.id = f"msg_{uuid.uuid4().hex[:8]}"
        if not hasattr(msg, 'sender_id') or not msg.sender_id:
            msg.sender_id = "user" if msg.role == MessageRole.USER else "assistant"
        if not hasattr(msg, 'sender_name') or not msg.sender_name:
            if msg.role == MessageRole.USER:
                msg.sender_name = "你"
            else:
                # 获取主角色名称
                main_char = session.story_state.characters[0] if session.story_state.characters else None
                msg.sender_name = main_char.name if main_char else "侦探"
        if not hasattr(msg, 'sender_avatar'):
            msg.sender_avatar = None
        if not hasattr(msg, 'mentioned_characters'):
            msg.mentioned_characters = []
        if not hasattr(msg, 'message_type'):
            msg.message_type = "text"

        messages.append({
            "id": msg.id,
            "role": msg.role.value,
            "sender_id": msg.sender_id,
            "sender_name": msg.sender_name,
            "sender_avatar": msg.sender_avatar,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat(),
            "options": msg.options,
            "mentioned_characters": msg.mentioned_characters,
            "message_type": msg.message_type
        })

    return GetMessagesResponse(
        messages=messages,
        total_rounds=session.dialogue_history.total_rounds
    )


@router.get("/characters", response_model=list[CharacterItem])
async def get_characters(session_id: str):
    """
    获取当前会话的角色列表

    返回所有角色及其状态信息
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 转换角色为响应格式
    characters = []
    for char in session.story_state.characters:
        characters.append({
            "id": char.id,
            "name": char.name,
            "avatar": char.avatar,
            "description": char.description,
            "is_active": char.is_active,
            "priority": char.priority
        })

    return characters


@router.post("/group-send", response_model=GroupChatSendResponse)
async def send_group_message(session_id: str, request: SendMessageRequest):
    """
    发送用户消息到群聊，并调度AI角色发言

    群聊模式下的消息发送接口，返回待发言的角色列表
    """
    session_service = get_session_service()
    group_chat_service = get_group_chat_service()
    character_service = get_character_service()

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
        custom_story_service = _get_custom_story_service(session_id) or get_story_service()
        ending = await _generate_game_ending(session, session_service, custom_story_service)
        return GroupChatSendResponse(
            scheduled_speakers=[],
            round_number=session.dialogue_history.total_rounds,
            remaining_time=session.remaining_time,
            game_over=True,
            ending=ending
        )

    try:
        # 解析消息中提及的角色
        mentioned_ids = character_service.parse_mentioned_characters(session, request.content)

        # 添加用户消息到历史
        message_id = f"msg_{uuid.uuid4().hex[:8]}"
        user_message = DialogueMessage(
            id=message_id,
            role=MessageRole.USER,
            sender_id="user",
            sender_name="你",
            sender_avatar=None,
            content=request.content,
            options=None,
            mentioned_characters=mentioned_ids,
            message_type="text"
        )
        session.dialogue_history.add_message(user_message)

        # 调度需要发言的角色
        scheduled_speakers = await group_chat_service.schedule_speeches_after_user_message(session, user_message)

        # 更新会话
        session.total_messages = len(session.dialogue_history.messages)
        session_service.update_session(session)

        # 检查游戏是否结束
        session.check_game_over()
        game_over = session.status == SessionStatus.ENDED

        # 如果游戏结束，生成结局
        if game_over:
            custom_story_service = _get_custom_story_service(session_id) or get_story_service()
            ending = await _generate_game_ending(session, session_service, custom_story_service)
            return GroupChatSendResponse(
                scheduled_speakers=[],
                round_number=session.dialogue_history.total_rounds,
                remaining_time=session.remaining_time,
                game_over=True,
                ending=ending
            )

        return GroupChatSendResponse(
            scheduled_speakers=scheduled_speakers,
            round_number=session.dialogue_history.total_rounds,
            remaining_time=session.remaining_time,
            game_over=False
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"处理消息失败: {str(e)}"
        )


@router.get("/next-speech", response_model=NextSpeechResponse)
async def get_next_speech(session_id: str):
    """
    获取下一个AI角色的发言

    轮询获取待发言队列中的下一条消息
    """
    logger.info(f"收到 next-speech 请求, session_id: {session_id}")
    session_service = get_session_service()
    group_chat_service = get_group_chat_service()

    # 获取会话
    session = session_service.get_session(session_id)
    if not session:
        logger.warning(f"会话不存在: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    try:
        # 获取下一个发言
        logger.info("调用 group_chat_service.get_next_speech...")
        message = await group_chat_service.get_next_speech(session)

        if not message:
            logger.info("没有待发言消息，检查是否需要触发空闲发言")
            # 检查是否需要触发空闲发言
            idle_message = await group_chat_service.schedule_idle_speech(session)
            if idle_message:
                message = idle_message
                logger.info("生成了空闲发言")
            else:
                logger.info("没有更多发言，返回 has_next=False")
                return NextSpeechResponse(
                    has_next=False,
                    message=None,
                    next_speaker=None
                )

        # 添加消息到历史
        session.dialogue_history.add_message(message)

        # 更新会话
        session.total_messages = len(session.dialogue_history.messages)
        session_service.update_session(session)

        # 转换为响应格式
        message_item = {
            "id": message.id,
            "role": message.role.value,
            "sender_id": message.sender_id,
            "sender_name": message.sender_name,
            "sender_avatar": message.sender_avatar,
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "options": message.options,
            "mentioned_characters": message.mentioned_characters,
            "message_type": message.message_type
        }
        logger.info(f"返回消息: {message_item}")

        # 获取下一个发言的角色名称
        next_speaker_name = None
        if session.current_speaker_queue:
            next_char_id = session.current_speaker_queue[0]
            for char in session.story_state.characters:
                if char.id == next_char_id:
                    next_speaker_name = char.name
                    break

        logger.info(f"下一个发言者: {next_speaker_name}")
        return NextSpeechResponse(
            has_next=True,
            message=message_item,
            next_speaker=next_speaker_name
        )

    except Exception as e:
        logger.exception(f"获取发言失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取发言失败: {str(e)}"
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