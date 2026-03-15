"""
游戏状态API
处理游戏状态查询和控制
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from ..services import get_session_service, get_timer_service
from ..models.session import SessionStatus


router = APIRouter(prefix="/sessions/{session_id}/game", tags=["game"])


# 请求/响应模型
class GameStateResponse(BaseModel):
    """游戏状态响应"""
    session_id: str = Field(..., description="会话ID")
    status: str = Field(..., description="游戏状态")
    is_active: bool = Field(..., description="是否活跃")
    is_paused: bool = Field(..., description="是否暂停")
    is_ended: bool = Field(..., description="是否结束")
    elapsed_time: float = Field(..., description="已过时间（秒）")
    remaining_time: float = Field(..., description="剩余时间（秒）")
    current_round: int = Field(..., description="当前轮次")
    max_rounds: int = Field(..., description="最大轮次")
    total_messages: int = Field(..., description="总消息数")


class PauseGameRequest(BaseModel):
    """暂停游戏请求"""
    pause: bool = Field(..., description="是否暂停")


class PauseGameResponse(BaseModel):
    """暂停游戏响应"""
    success: bool = Field(..., description="操作是否成功")
    status: str = Field(..., description="当前状态")


@router.get("/state", response_model=GameStateResponse)
async def get_game_state(session_id: str):
    """
    获取游戏状态

    返回游戏的完整状态信息，包括时间、轮次、状态等
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

    return GameStateResponse(
        session_id=session.session_id,
        status=session.status.value,
        is_active=session.status == SessionStatus.ACTIVE,
        is_paused=session.status == SessionStatus.PAUSED,
        is_ended=session.status == SessionStatus.ENDED,
        elapsed_time=session.elapsed_time,
        remaining_time=session.remaining_time,
        current_round=session.dialogue_history.total_rounds,
        max_rounds=session.max_rounds,
        total_messages=session.total_messages
    )


@router.get("/time", response_model=dict[str, float])
async def get_game_time(session_id: str):
    """
    获取游戏时间信息

    返回已过时间和剩余时间
    """
    session_service = get_session_service()
    timer_service = get_timer_service()

    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    return {
        "elapsed_time": session.elapsed_time,
        "remaining_time": session.remaining_time,
        "max_duration": session.max_duration_seconds
    }


@router.get("/rounds", response_model=dict[str, int])
async def get_game_rounds(session_id: str):
    """
    获取游戏轮次信息

    返回当前轮次和最大轮次
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    return {
        "current_round": session.dialogue_history.total_rounds,
        "max_rounds": session.max_rounds,
        "remaining_rounds": session.max_rounds - session.dialogue_history.total_rounds
    }


@router.post("/pause", response_model=PauseGameResponse)
async def pause_game(session_id: str, request: PauseGameRequest):
    """
    暂停/恢复游戏

    控制游戏的暂停和恢复状态
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    if session.status == SessionStatus.ENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="游戏已结束，无法暂停/恢复"
        )

    # 更新暂停状态
    if request.pause:
        session.status = SessionStatus.PAUSED
    else:
        session.status = SessionStatus.ACTIVE

    session_service.update_session(session)

    return PauseGameResponse(
        success=True,
        status=session.status.value
    )


@router.get("/summary")
async def get_game_summary(session_id: str):
    """
    获取游戏摘要

    返回故事背景、已发现线索、当前章节等信息
    """
    session_service = get_session_service()
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在"
        )

    return {
        "background": session.story_state.background,
        "current_chapter": session.story_state.current_chapter,
        "characters": [
            {
                "name": char.name,
                "description": char.description
            }
            for char in session.story_state.characters
        ],
        "clues": [
            {
                "id": clue.id,
                "content": clue.content,
                "discovered_at": clue.discovered_at,
                "is_key": clue.is_key
            }
            for clue in session.story_state.clues
        ],
        "context_summary": session.story_state.context_summary
    }
