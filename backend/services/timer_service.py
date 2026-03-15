"""
计时器服务
管理游戏倒计时和定时任务
"""

import asyncio
from typing import Optional, Callable
from loguru import logger

from ..models.session import GameSession


class TimerService:
    """计时器服务"""

    def __init__(self):
        """初始化计时器服务"""
        # 存储会话的定时任务
        self.timers: dict[str, asyncio.Task] = {}
        logger.info("计时器服务初始化完成")

    async def start_timer(
        self,
        session_id: str,
        duration_seconds: float,
        on_timeout: Callable
    ) -> None:
        """
        启动计时器

        Args:
            session_id: 会话ID
            duration_seconds: 持续时间（秒）
            on_timeout: 超时回调函数
        """
        # 取消已存在的计时器
        if session_id in self.timers:
            self.stop_timer(session_id)

        # 创建新的计时任务
        async def timer_task():
            try:
                await asyncio.sleep(duration_seconds)
                logger.info(f"会话 {session_id} 计时结束")
                await on_timeout()
            except asyncio.CancelledError:
                logger.debug(f"会话 {session_id} 计时器被取消")
                raise

        self.timers[session_id] = asyncio.create_task(timer_task())
        logger.info(f"启动计时器: 会话 {session_id}, 时长 {duration_seconds}秒")

    def stop_timer(self, session_id: str) -> bool:
        """
        停止计时器

        Args:
            session_id: 会话ID

        Returns:
            成功停止返回True，否则返回False
        """
        if session_id not in self.timers:
            return False

        task = self.timers[session_id]
        task.cancel()
        del self.timers[session_id]
        logger.info(f"停止计时器: 会话 {session_id}")
        return True

    def get_remaining_time(self, session: GameSession) -> float:
        """
        获取会话的剩余时间

        Args:
            session: 游戏会话

        Returns:
            剩余时间（秒）
        """
        return session.remaining_time

    def cleanup_timer(self, session_id: str) -> None:
        """
        清理计时器

        Args:
            session_id: 会话ID
        """
        self.stop_timer(session_id)


# 全局计时器服务实例
_timer_service: Optional[TimerService] = None


def get_timer_service() -> TimerService:
    """获取计时器服务单例"""
    global _timer_service
    if _timer_service is None:
        _timer_service = TimerService()
    return _timer_service
