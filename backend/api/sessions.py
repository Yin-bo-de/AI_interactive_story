"""
会话相关API
处理会话的创建、获取和管理
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

from ..services import get_session_service, get_story_service, get_timer_service
from ..models.session import SessionStatus


router = APIRouter(prefix="/sessions", tags=["sessions"])


# 请求/响应模型
class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    user_id: Optional[str] = Field(None, description="用户ID（可选）")
    story_type: str = Field(default="mystery", description="故事类型")
    max_duration_seconds: int = Field(default=1800, description="最大持续时间（秒）")
    max_rounds: int = Field(default=100, description="最大轮次")


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

    # 创建会话
    session = session_service.create_session(
        user_id=request.user_id,
        story_type=request.story_type,
        max_duration_seconds=request.max_duration_seconds,
        max_rounds=request.max_rounds
    )

    try:
        # 初始化故事
        story_init = await story_service.initialize_story(session, request.story_type)

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
        scene_intro = await story_service.generate_scene_intro(session)

        # 更新会话状态为活跃
        session.status = SessionStatus.ACTIVE
        session.start_time = datetime.now()  # 重置开始时间，从进入现场开始计时
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