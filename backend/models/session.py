"""
会话状态模型
管理用户的游戏会话，包括状态、计时器等信息
"""

from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from .dialogue import DialogueHistory
from .story_state import StoryState


class SessionStatus(str, Enum):
    """会话状态枚举"""
    INITIALIZING = "initializing"  # 初始化中
    WAITING = "waiting"            # 等待用户进入现场
    ACTIVE = "active"              # 进行中
    PAUSED = "paused"              # 已暂停
    ENDED = "ended"                # 已结束


class GameSession(BaseModel):
    """游戏会话模型"""
    session_id: str = Field(..., description="会话唯一ID")
    user_id: Optional[str] = Field(None, description="用户ID（可选）")
    story_type: str = Field(default="mystery", description="故事类型")
    status: SessionStatus = Field(default=SessionStatus.INITIALIZING, description="会话状态")

    # 故事相关
    dialogue_history: DialogueHistory = Field(default_factory=DialogueHistory, description="对话历史")
    story_state: StoryState = Field(default_factory=StoryState, description="故事状态")

    # 时间控制
    start_time: datetime = Field(default_factory=datetime.now, description="会话开始时间")
    end_time: Optional[datetime] = Field(None, description="会话结束时间")
    max_duration_seconds: int = Field(default=1800, description="最大持续时间（秒）")
    max_rounds: int = Field(default=100, description="最大轮次")

    # 统计
    total_messages: int = Field(default=0, description="总消息数")

    @property
    def elapsed_time(self) -> float:
        """获取已过时间（秒）"""
        end = self.end_time or datetime.now()
        return (end - self.start_time).total_seconds()

    @property
    def remaining_time(self) -> float:
        """获取剩余时间（秒）"""
        return max(0, self.max_duration_seconds - self.elapsed_time)

    @property
    def is_time_up(self) -> bool:
        """检查时间是否到期"""
        return self.elapsed_time >= self.max_duration_seconds

    @property
    def is_rounds_up(self) -> bool:
        """检查轮次是否已达上限"""
        return self.dialogue_history.total_rounds >= self.max_rounds

    @property
    def is_finished(self) -> bool:
        """检查会话是否已结束"""
        return self.status == SessionStatus.ENDED

    def check_game_over(self) -> bool:
        """检查游戏是否结束（时间或轮次任一先到）"""
        if self.is_time_up or self.is_rounds_up:
            self.status = SessionStatus.ENDED
            self.end_time = datetime.now()
            return True
        return False

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "session_123",
                "user_id": "user_456",
                "story_type": "mystery",
                "status": "active",
                "start_time": "2026-03-15T10:00:00",
                "max_duration_seconds": 1800,
                "max_rounds": 100
            }
        }
