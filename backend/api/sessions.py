"""
会话相关API
处理会话的创建、获取和管理
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Any
from loguru import logger
import os
from ..services import get_session_service, get_story_service, get_timer_service
from ..models.session import SessionStatus


router = APIRouter(prefix="/sessions", tags=["sessions"])

# 存储自定义故事服务实例 {session_id: story_service}
_custom_story_services = {}

# 存储兑换码 {code: {"api_key": ..., "api_base": ..., "model_name": ..., "remaining_games": ...}}
# 格式: "XXXX-XXXX-XXXX-XXXX": {"api_key": "xxx", "api_base": "xxx", "model_name": "xxx", "remaining_games": 10}
_redemption_codes = {
  "7FUF-0UZG-1NQT-69KL": {
    "api_key": os.getenv("ALIYUN_API_KEY"),
    "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "model_name": "qwen3.5-plus",
    "remaining_games": 10
  }
}


# 请求/响应模型
class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    user_id: Optional[str] = Field(None, description="用户ID（可选）")
    story_type: str = Field(default="mystery", description="故事类型")
    max_duration_seconds: int = Field(default=1800, description="最大持续时间（秒）")
    max_rounds: int = Field(default=100, description="最大轮次")
    api_key: Optional[str] = Field(None, description="API Key（可选）")
    api_base: Optional[str] = Field(None, description="API Base URL（可选）")
    model_name: Optional[str] = Field(None, description="模型名称（可选）")
    redemption_code: Optional[str] = Field(None, description="兑换码（可选）")


class CreateSessionResponse(BaseModel):
    """创建会话响应（第一阶段：背景介绍）"""
    session_id: str = Field(..., description="会话ID")
    story_type: str = Field(..., description="故事类型")
    background: str = Field(..., description="故事背景")
    characters: list[dict] = Field(..., description="角色列表")
    user_identity: dict = Field(..., description="用户身份")
    max_duration_seconds: int = Field(default=1800, description="最大持续时间（秒）")
    max_rounds: int = Field(default=100, description="最大轮次")


class EnterSceneRequest(BaseModel):
    """进入现场请求"""
    pass


class EnterSceneResponse(BaseModel):
    """进入现场响应（第二阶段：现场介绍）"""
    initial_message: str = Field(..., description="初始AI消息")
    options: list[str] = Field(..., description="初始选项")
    opening_scene: str = Field(..., description="开场场景")


class SessionStatusResponse(BaseModel):
    """会话状态响应"""
    session_id: str = Field(..., description="会话ID")
    status: str = Field(..., description="会话状态")
    elapsed_time: float = Field(..., description="已过时间（秒）")
    remaining_time: float = Field(..., description="剩余时间（秒）")
    total_rounds: int = Field(..., description="当前轮次")
    max_rounds: int = Field(..., description="最大轮次")
    total_messages: int = Field(..., description="总消息数")


class SessionDetailsResponse(BaseModel):
    """会话详情响应"""
    session_id: str = Field(..., description="会话ID")
    user_id: Optional[str] = Field(None, description="用户ID")
    story_type: str = Field(..., description="故事类型")
    status: str = Field(..., description="会话状态")
    background: str = Field(..., description="故事背景")
    current_chapter: str = Field(..., description="当前章节")
    total_rounds: int = Field(..., description="当前轮次")
    elapsed_time: float = Field(..., description="已过时间（秒）")
    remaining_time: float = Field(..., description="剩余时间（秒）")


@router.post("/create", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: CreateSessionRequest):
    """
    创建新游戏会话（第一阶段）

    初始化故事内容，生成背景、人物和用户身份
    此时会话状态为 WAITING，等待用户进入现场
    """
    session_service = get_session_service()
    story_service = get_story_service()

    # 处理兑换码
    api_key = request.api_key
    api_base = request.api_base
    model_name = request.model_name

    if request.redemption_code:
        global _redemption_codes
        if request.redemption_code in _redemption_codes:
            code_info = _redemption_codes[request.redemption_code]
            if code_info["remaining_games"] > 0:
                # 使用兑换码中的配置
                api_key = code_info["api_key"]
                api_base = code_info["api_base"]
                model_name = code_info["model_name"]
                # 减少游戏次数
                code_info["remaining_games"] -= 1
                logger.info(f"使用兑换码 {request.redemption_code}，剩余游戏次数: {code_info['remaining_games']}")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="该兑换码游戏次数已用完"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="兑换码不存在或已失效"
            )

    # 创建会话
    session = session_service.create_session(
        user_id=request.user_id,
        story_type=request.story_type,
        max_duration_seconds=request.max_duration_seconds,
        max_rounds=request.max_rounds,
        api_key=api_key,
        api_base=api_base,
        model_name=model_name
    )

    # 创建故事服务实例，如果提供了API配置则使用新的LLM服务实例
    if api_key and api_base:
        from ..services.llm_service import LLMService
        from ..services.story_service import StoryService
        custom_llm_service = LLMService(
            api_key=api_key,
            api_base=api_base,
            model_name=model_name
        )
        custom_story_service = StoryService(llm_service=custom_llm_service)
        # 将自定义服务实例存储到全局字典中
        global _custom_story_services
        _custom_story_services[session.session_id] = custom_story_service

    try:
        # 使用自定义服务实例（如果有）
        current_story_service = _custom_story_services.get(session.session_id, story_service)
        # 初始化故事
        story_init = await current_story_service.initialize_story(session, request.story_type)

        # 更新会话状态为等待用户进入现场
        session.status = SessionStatus.WAITING
        session_service.update_session(session)

        return CreateSessionResponse(
            session_id=session.session_id,
            story_type=session.story_type,
            background=story_init["background"],
            characters=story_init["characters"],
            user_identity=story_init["user_identity"],
            max_duration_seconds=session.max_duration_seconds,
            max_rounds=session.max_rounds
        )

    except Exception as e:
        # 清理失败的会话
        session_service.delete_session(session.session_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建会话失败: {str(e)}"
        )


@router.post("/{session_id}/enter-scene", response_model=EnterSceneResponse, status_code=status.HTTP_200_OK)
async def enter_scene(session_id: str):
    """
    进入现场（第二阶段）

    用户点击"进入现场"按钮后调用，生成现场介绍消息
    此时会话状态变为 ACTIVE，计时器开始计时
    """
    session_service = get_session_service()
    story_service = get_story_service()
    timer_service = get_timer_service()

    # 获取自定义的故事服务实例（如果有）
    global _custom_story_services
    current_story_service = _custom_story_services.get(session_id, story_service)

    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    if session.status != SessionStatus.WAITING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="会话状态不正确"
        )

    try:
        # 生成现场介绍消息
        scene_intro = await current_story_service.generate_scene_intro(session)

        # 更新会话状态为活跃
        session.status = SessionStatus.ACTIVE
        session.start_time = datetime.now()  # 重置开始时间，从进入现场开始计时

        # 激活所有角色（群聊模式）
        for char in session.story_state.characters:
            char.is_active = True

        # 创建群聊欢迎消息（系统消息）
        import uuid
        from ..models.dialogue import DialogueMessage, MessageRole

        # 准备角色列表描述
        characters_list_desc = "\n".join([
            f"- {char.name}: {char.description}"
            for char in session.story_state.characters
        ])

        # 生成群聊开场欢迎消息
        welcome_message_id = f"msg_{uuid.uuid4().hex[:8]}"
        welcome_content = f"""🎉 欢迎来到案发现场！

**故事背景**：{session.story_state.background}

**在场人员**：
{characters_list_desc}

现在大家已经聚集在这里，让我们开始调查吧！"""

        welcome_message = DialogueMessage(
            id=welcome_message_id,
            role=MessageRole.SYSTEM,
            sender_id="system",
            sender_name="系统",
            sender_avatar="📢",
            content=welcome_content,
            options=scene_intro.get("options", []),
            mentioned_characters=[],
            message_type="system"
        )
        session.dialogue_history.add_message(welcome_message)

        # 添加主角色的开场消息
        main_char = session.story_state.characters[0] if session.story_state.characters else None
        if main_char:
            main_message_id = f"msg_{uuid.uuid4().hex[:8]}"
            main_message = DialogueMessage(
                id=main_message_id,
                role=MessageRole.ASSISTANT,
                sender_id=main_char.id,
                sender_name=main_char.name,
                sender_avatar=main_char.avatar,
                content=scene_intro["message"],
                options=scene_intro.get("options", []),
                mentioned_characters=[],
                message_type="text"
            )
            session.dialogue_history.add_message(main_message)

        session_service.update_session(session)

        # 启动计时器
        async def on_timeout():
            """超时回调函数"""
            # 更新会话状态为结束
            session.status = SessionStatus.ENDED
            session.end_time = datetime.now()
            session_service.update_session(session)
            logger.info(f"会话 {session_id} 时间到，游戏结束")

        # 启动计时器，传递必要的参数
        await timer_service.start_timer(
            session_id=session_id,
            duration_seconds=session.max_duration_seconds,
            on_timeout=on_timeout
        )

        return EnterSceneResponse(
            initial_message=scene_intro["message"],
            options=scene_intro.get("options", []),
            opening_scene=session.story_state.opening_scene
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"进入现场失败: {str(e)}"
        )


@router.get("/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(session_id: str):
    """
    获取会话状态

    返回会话的当前状态、时间、轮次等信息
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 检查游戏是否结束
    session.check_game_over()
    session_service.update_session(session)

    return SessionStatusResponse(
        session_id=session.session_id,
        status=session.status.value,
        elapsed_time=session.elapsed_time,
        remaining_time=session.remaining_time,
        total_rounds=session.dialogue_history.total_rounds,
        max_rounds=session.max_rounds,
        total_messages=session.total_messages
    )


@router.get("/{session_id}", response_model=SessionDetailsResponse)
async def get_session_details(session_id: str):
    """
    获取会话详情

    返回会话的完整信息，包括故事背景、当前章节等
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 检查游戏是否结束
    session.check_game_over()
    session_service.update_session(session)

    return SessionDetailsResponse(
        session_id=session.session_id,
        user_id=session.user_id,
        story_type=session.story_type,
        status=session.status.value,
        background=session.story_state.background,
        current_chapter=session.story_state.current_chapter,
        total_rounds=session.dialogue_history.total_rounds,
        elapsed_time=session.elapsed_time,
        remaining_time=session.remaining_time
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    """
    删除会话

    删除指定的游戏会话及其所有数据
    """
    session_service = get_session_service()
    timer_service = get_timer_service()

    # 停止计时器
    timer_service.stop_timer(session_id)

    # 删除会话
    if not session_service.delete_session(session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    return None


class EndGameResponse(BaseModel):
    """结束游戏响应"""
    ending_title: str = Field(..., description="结局标题")
    ending_story: str = Field(..., description="结局故事")
    truth_revealed: str = Field(..., description="揭晓的真相")
    clues_explanation: str = Field(..., description="线索解释")
    player_evaluation: str = Field(..., description="玩家评价")
    rating: float = Field(..., description="评分")


class VerifyAPIRequest(BaseModel):
    """验证API请求"""
    api_key: str = Field(..., description="API Key")
    api_base: str = Field(..., description="API Base URL")
    model_name: str = Field(default="gpt-4o", description="模型名称")


class VerifyAPIResponse(BaseModel):
    """验证API响应"""
    success: bool = Field(..., description="验证是否成功")
    message: str = Field(..., description="验证结果结果消息")


class VerifyCodeRequest(BaseModel):
    """验证兑换码请求"""
    code: str = Field(..., description="兑换码")


class VerifyCodeResponse(BaseModel):
    """验证兑换码响应"""
    success: bool = Field(..., description="验证是否成功")
    message: str = Field(..., description="验证结果消息")
    remaining_games: int = Field(default=0, description="剩余游戏次数")
    api_key: Optional[str] = Field(None, description="API Key")
    api_base: Optional[str] = Field(None, description="API Base URL")
    model_name: Optional[str] = Field(None, description="模型名称")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "兑换码验证成功",
                "remaining_games": 10,
                "api_key": "sk-xxx",
                "api_base": "https://api.openai.com/v1",
                "model_name": "gpt-4o"
            }
        }


@router.post("/verify-api", response_model=VerifyAPIResponse, status_code=status.HTTP_200_OK)
async def verify_api(request: VerifyAPIRequest):
    """
    验证API Key和Base URL是否正确

    发送一个简单的测试请求来验证API配置是否有效
    """
    from ..services.llm_service import LLMService
    from httpx import AsyncClient, Timeout

    try:
        test_api_key = request.api_key
        test_api_base = request.api_base.rstrip('/')
        test_model_name = request.model_name

        headers = {
            "Authorization": f"Bearer {test_api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": test_model_name,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 10,
            "temperature": 0.8
        }

        async with AsyncClient(timeout=Timeout(30.0)) as client:
            response = await client.post(test_api_base, headers=headers, json=data)

            if response.status_code == 200:
                result = response.json()
                if "choices" in result or "content" in result:
                    return VerifyAPIResponse(
                        success=True,
                        message="API验证成功"
                    )

            if response.status_code == 401:
                return VerifyAPIResponse(
                    success=False,
                    message="API Key无效"
                )

            error_detail = "API验证失败"
            try:
                error_data = response.json()
                if "error" in error_data:
                    error_detail = error_data["error"].get("message", str(error_data["error"]))
            except:
                pass

            return VerifyAPIResponse(
                success=False,
                message=error_detail
            )

    except Exception as e:
        logger.error(f"验证API失败: {e}")
        return VerifyAPIResponse(
            success=False,
            message=f"API验证失败: {str(e)}"
        )


@router.post("/verify-code", response_model=VerifyCodeResponse, status_code=status.HTTP_200_OK)
async def verify_code(request: VerifyCodeRequest):
    """
    验证兑换码

    验证兑换码是否有效，返回剩余游戏次数和API配置信息
    """
    global _redemption_codes

    if not request.code or len(request.code) != 19:
        return VerifyCodeResponse(
            success=False,
            message="兑换码格式不正确"
        )

    if request.code not in _redemption_codes:
        return VerifyCodeResponse(
            success=False,
            message="兑换码不存在或已失效"
        )

    code_info = _redemption_codes[request.code]

    if code_info["remaining_games"] <= 0:
        return VerifyCodeResponse(
            success=False,
            message="该兑换码游戏次数已用完"
        )

    return VerifyCodeResponse(
        success=True,
        message="兑换码验证成功",
        remaining_games=code_info["remaining_games"],
        api_key=code_info["api_key"],
        api_base=code_info["api_base"],
        model_name=code_info["model_name"]
    )


@router.post("/{session_id}/end-game", response_model=EndGameResponse, status_code=status.HTTP_200_OK)
async def end_game(session_id: str):
    """
    结束游戏并生成结局

    当时间到或玩家主动结束游戏时调用，生成完整的结局内容
    """
    session_service = get_session_service()
    story_service = get_story_service()
    timer_service = get_timer_service()

    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    # 停止计时器
    timer_service.stop_timer(session_id)

    # 检查游戏是否结束
    session.check_game_over()
    session_service.update_session(session)

    try:
        # 选择选择最合适的结局
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

        logger.info(f"会话 {session_id} 已结束，生成结局: {ending_result.get('ending_title')}")

        return EndGameResponse(
            ending_title=ending_result.get("ending_title", "故事暂告段落"),
            ending_story=ending_result.get("ending_story", ""),
            truth_revealed=ending_result.get("truth_revealed", ""),
            clues_explanation=ending_result.get("clues_explanation", ""),
            player_evaluation=ending_result.get("player_evaluation", ""),
            rating=ending_result.get("rating", 7.0)
        )

    except Exception as e:
        logger.error(f"生成结局失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成结局失败: {str(e)}"
        )