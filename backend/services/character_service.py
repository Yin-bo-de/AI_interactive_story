"""
角色管理服务
管理角色的创建、更新、状态管理等
"""
from typing import List, Optional, Dict
from datetime import datetime
import uuid

from ..models.story_state import Character
from ..models.session import GameSession

class CharacterService:
    """角色管理服务"""

    def __init__(self):
        pass

    def create_character(
        self,
        name: str,
        description: str,
        personality: str = "",
        speaking_style: str = "",
        priority: int = 2,
        avatar: Optional[str] = None,
        known_clues: Optional[List[str]] = None,
        relationships: Optional[Dict[str, str]] = None
    ) -> Character:
        """创建新角色"""
        character_id = f"char_{uuid.uuid4().hex[:8]}"
        return Character(
            id=character_id,
            name=name,
            description=description,
            personality=personality,
            speaking_style=speaking_style,
            priority=priority,
            avatar=avatar,
            is_active=False,  # 默认未激活，需要手动加入群聊
            last_speak_time=None,
            known_clues=known_clues or [],
            relationships=relationships or {}
        )

    def activate_character(self, session: GameSession, character_id: str) -> bool:
        """激活角色，加入群聊"""
        for char in session.story_state.characters:
            if char.id == character_id:
                char.is_active = True
                return True
        return False

    def deactivate_character(self, session: GameSession, character_id: str) -> bool:
        """禁用角色，移出群聊"""
        for char in session.story_state.characters:
            if char.id == character_id:
                char.is_active = False
                return True
        return False

    def get_active_characters(self, session: GameSession) -> List[Character]:
        """获取当前会话中所有活跃的角色"""
        return [char for char in session.story_state.characters if char.is_active]

    def get_character_by_id(self, session: GameSession, character_id: str) -> Optional[Character]:
        """根据ID获取角色"""
        for char in session.story_state.characters:
            if char.id == character_id:
                return char
        return None

    def get_character_by_name(self, session: GameSession, name: str) -> Optional[Character]:
        """根据名称获取角色（模糊匹配）"""
        name_lower = name.lower()
        for char in session.story_state.characters:
            if name_lower in char.name.lower():
                return char
        return None

    def update_character_clues(self, session: GameSession, character_id: str, new_clues: List[str]) -> bool:
        """更新角色掌握的线索"""
        char = self.get_character_by_id(session, character_id)
        if char:
            char.known_clues.extend(new_clues)
            return True
        return False

    def update_character_relationship(self, session: GameSession, character_id: str, target_char_id: str, relationship: str) -> bool:
        """更新角色关系"""
        char = self.get_character_by_id(session, character_id)
        if char:
            char.relationships[target_char_id] = relationship
            return True
        return False

    def update_last_speak_time(self, session: GameSession, character_id: str) -> bool:
        """更新角色上次发言时间"""
        char = self.get_character_by_id(session, character_id)
        if char:
            char.last_speak_time = datetime.now()
            return True
        return False

    def parse_mentioned_characters(self, session: GameSession, content: str) -> List[str]:
        """解析消息中@提及的角色ID"""
        mentioned_ids = []
        active_chars = self.get_active_characters(session)
        for char in active_chars:
            if f"@{char.name}" in content:
                mentioned_ids.append(char.id)
        return mentioned_ids


# 单例实例
_character_service = CharacterService()

def get_character_service() -> CharacterService:
    """获取角色服务单例"""
    return _character_service
