"""
对话消息模型
定义用户和AI之间的消息结构
"""

from enum import Enum
from typing import Optional, List, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """消息角色枚举"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class DialogueMessage(BaseModel):
    """对话消息模型"""
    role: MessageRole = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")
    timestamp: datetime = Field(default_factory=datetime.now, description="消息时间戳")
    options: Optional[List[str]] = Field(None, description="AI提供的引导选项")

    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "我想要调查这个案件",
                "timestamp": "2026-03-15T10:30:00",
                "options": None
            }
        }


class DialogueHistory(BaseModel):
    """对话历史模型"""
    session_id: str = Field(..., description="会话ID")
    messages: List[DialogueMessage] = Field(default_factory=list, description="对话消息列表")
    total_rounds: int = Field(default=0, description="总轮次")

    def add_message(self, message: DialogueMessage) -> None:
        """添加消息到历史"""
        self.messages.append(message)
        if message.role == MessageRole.USER:
            self.total_rounds += 1

    def get_recent_messages(self, n: int = 10) -> List[DialogueMessage]:
        """获取最近N条消息"""
        return self.messages[-n:] if n > 0 else self.messages

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "session_123",
                "messages": [],
                "total_rounds": 0
            }
        }