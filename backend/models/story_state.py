"""
故事状态模型
维护游戏的剧情状态，包括背景、人物、线索、结局种子等
"""

from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class Character(BaseModel):
    """角色模型"""
    id: str = Field(..., description="角色唯一标识")
    name: str = Field(..., description="角色名称")
    description: str = Field(..., description="角色描述")
    avatar: Optional[str] = Field(None, description="角色头像URL")
    personality: str = Field(default="", description="性格特点")
    speaking_style: str = Field(default="", description="说话风格")
    priority: int = Field(default=2, description="角色优先级，1=主控角色，2=重要角色，3=普通角色")
    is_active: bool = Field(default=False, description="是否已加入群聊并可以主动发言")
    last_speak_time: Optional[datetime] = Field(None, description="上次发言时间")
    known_clues: List[str] = Field(default_factory=list, description="该角色掌握的线索列表")
    relationships: Dict[str, str] = Field(default_factory=dict, description="与其他角色的关系，key为角色ID，value为关系描述")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "detective_lin",
                "name": "林默",
                "description": "一位经验丰富、思维敏捷的侦探",
                "avatar": None,
                "personality": "冷静严谨，观察力敏锐",
                "speaking_style": "说话简洁，逻辑性强，喜欢提问",
                "priority": 1,
                "is_active": True,
                "last_speak_time": None,
                "known_clues": ["死者身上有刺伤", "现场有打斗痕迹"],
                "relationships": {
                    "housekeeper_wang": "王管家是死者的仆人，看起来有些可疑"
                }
            }
        }


class Clue(BaseModel):
    """线索模型"""
    id: str = Field(..., description="线索ID")
    content: str = Field(..., description="线索内容")
    discovered_at: int = Field(..., description="发现时的轮次")
    is_key: bool = Field(default=False, description="是否为关键线索")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "clue_1",
                "content": "现场发现了一枚独特的戒指",
                "discovered_at": 5,
                "is_key": True
            }
        }


class EndingSeed(BaseModel):
    """结局种子模型"""
    id: str = Field(..., description="种子ID")
    description: str = Field(..., description="结局描述")
    probability: float = Field(default=0.33, description="初始概率")
    confidence: float = Field(default=0.0, description="当前置信度")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "ending_1",
                "description": "凶手是管家，为了保护遗产而杀人",
                "probability": 0.33,
                "confidence": 0.0
            }
        }


class UserIdentity(BaseModel):
    """用户身份模型"""
    role: str = Field(default="侦探助理", description="用户在故事中的角色")
    description: str = Field(default="", description="用户身份的详细描述")


class StoryState(BaseModel):
    """故事状态模型"""
    background: str = Field(default="", description="故事背景")
    characters: List[Character] = Field(default_factory=list, description="角色列表")
    user_identity: UserIdentity = Field(default_factory=UserIdentity, description="用户身份")
    clues: List[Clue] = Field(default_factory=list, description="已发现线索")
    ending_seeds: List[EndingSeed] = Field(default_factory=list, description="可能的结局种子")
    current_chapter: str = Field(default="开始", description="当前章节")
    context_summary: str = Field(default="", description="上下文摘要")
    opening_scene: str = Field(default="", description="开场场景")
    suggestions: List[str] = Field(default_factory=list, description="行动建议")

    def add_clue(self, clue: Clue) -> None:
        """添加线索"""
        self.clues.append(clue)

    def update_ending_confidence(self, seed_id: str, confidence: float) -> None:
        """更新结局种子置信度"""
        for seed in self.ending_seeds:
            if seed.id == seed_id:
                seed.confidence = confidence
                break

    def get_selected_ending(self) -> Optional[EndingSeed]:
        """获取置信度最高的结局种子"""
        if not self.ending_seeds:
            return None
        return max(self.ending_seeds, key=lambda x: x.confidence)

    class Config:
        json_schema_extra = {
            "example": {
                "background": "",
                "characters": [],
                "clues": [],
                "ending_seeds": [],
                "current_chapter": "开始",
                "context_summary": ""
            }
        }