"""
会话服务
管理游戏会话的创建、获取、更新和删除
"""

import uuid
from typing import Optional
from loguru import logger

from ..models.session import GameSession, SessionStatus


class SessionService:
    """会话管理服务"""

    def __init__(self):
        """初始化会话服务"""
        # 使用内存存储会话（可扩展为数据库）
        self.sessions: dict[str, GameSession] = {}
        logger.info("会话服务初始化完成")

    def create_session(
        self,
        user_id: Optional[str] = None,
        story_type: str = "mystery",
        max_duration_seconds: int = 1800,
        max_rounds: int = 100,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> GameSession:
        """
        创建新会话

        Args:
            user_id: 用户ID（可选）
            story_type: 故事类型
            max_duration_seconds: 最大持续时间（秒）
            max_rounds: 最大轮次
            api_key: API Key（可选）
            api_base: API Base URL（可选）
            model_name: 模型名称（可选）

        Returns:
            创建的会话对象
        """
        session_id = str(uuid.uuid4())

        # 创建会话
        from ..models.dialogue import DialogueHistory
        from ..models.story_state import StoryState

        session = GameSession(
            session_id=session_id,
            user_id=user_id,
            story_type=story_type,
            max_duration_seconds=max_duration_seconds,
            max_rounds=max_rounds,
            dialogue_history=DialogueHistory(session_id=session_id),
            story_state=StoryState(),
            api_key=api_key,
            api_base=api_base,
            model_name=model_name
        )

        self.sessions[session_id] = session
        logger.info(f"创建新会话: {session_id}")

        return session

    def get_session(self, session_id: str) -> Optional[GameSession]:
        """
        获取会话

        Args:
            session_id: 会话ID

        Returns:
            会话对象，如果不存在则返回None
        """
        return self.sessions.get(session_id)

    def update_session(self, session: GameSession) -> bool:
        """
        更新会话

        Args:
            session: 会话对象

        Returns:
            更新成功返回True，失败返回False
        """
        if session.session_id not in self.sessions:
            logger.warning(f"会话不存在: {session.session_id}")
            return False

        self.sessions[session.session_id] = session
        return True

    def delete_session(self, session_id: str) -> bool:
        """
        删除会话

        Args:
            session_id: 会话ID

        Returns:
            删除成功返回True，失败返回False
        """
        if session_id not in self.sessions:
            logger.warning(f"会话不存在: {session_id}")
            return False

        del self.sessions[session_id]
        logger.info(f"删除会话: {session_id}")
        return True

    def get_all_sessions(self) -> list[GameSession]:
        """获取所有会话"""
        return list(self.sessions.values())

    def get_active_sessions(self) -> list[GameSession]:
        """获取所有活跃会话"""
        return [
            s for s in self.sessions.values()
            if s.status == SessionStatus.ACTIVE
        ]

    def cleanup_expired_sessions(self) -> int:
        """
        清理已过期或结束的会话

        Returns:
            清理的会话数量
        """
        to_delete = []
        for session_id, session in self.sessions.items():
            if session.status == SessionStatus.ENDED:
                to_delete.append(session_id)

        for session_id in to_delete:
            del self.sessions[session_id]

        if to_delete:
            logger.info(f"清理了 {len(to_delete)} 个已结束的会话")

        return len(to_delete)


# 全局会话服务实例
_session_service: Optional[SessionService] = None


def get_session_service() -> SessionService:
    """获取会话服务单例"""
    global _session_service
    if _session_service is None:
        _session_service = SessionService()
    return _session_service
