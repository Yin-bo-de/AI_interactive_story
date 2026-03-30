"""
故事服务
处理故事逻辑，包括结局种子管理和上下文摘要
"""

import os
import json
from typing import Optional, Any, List, Dict
from loguru import logger

from ..models.session import GameSession
from ..models.story_state import EndingSeed, Clue, Character
from ..prompts import get_init_prompt, get_opening_roleplay_prompt, get_scene_intro_prompt, get_continue_prompt, get_summary_prompt
from .llm_service import get_llm_service




class StoryService:
    """故事逻辑服务"""

    def __init__(self, llm_service: Optional["LLMService"] = None):
        """初始化故事服务"""
        self.llm_service = llm_service or get_llm_service()
        logger.info("故事服务初始化完成")

    async def initialize_story(
        self,
        session: GameSession,
        story_type: str = "mystery"
    ) -> Dict[str, Any]:
        """
        初始化故事，生成背景、人物和结局种子

        Args:
            session: 游戏会话
            story_type: 故事类型

        Returns:
            包含故事初始化信息的字典
        """
        try:
            # 生成故事初始化内容
            prompt = get_init_prompt(story_type)
            result = await self.llm_service.call_llm_json(prompt)

            # 更新会话的故事状态
            session.story_state.background = result.get("background", "")
            # 处理角色数据，自动生成id如果不存在
            characters_data = result.get("characters", [])
            processed_characters = []
            for i, char in enumerate(characters_data):
                # 如果没有id，自动生成
                if "id" not in char or not char["id"]:
                    char["id"] = f"char_{i}_{char.get('name', 'unknown').lower().replace(' ', '_')}"
                # 补充默认字段
                if "personality" not in char:
                    char["personality"] = ""
                if "speaking_style" not in char:
                    char["speaking_style"] = ""
                if "priority" not in char:
                    char["priority"] = 1 if i == 0 else 2  # 第一个角色是主控，优先级1
                if "is_active" not in char:
                    char["is_active"] = True  # 默认激活所有角色
                if "known_clues" not in char:
                    char["known_clues"] = []
                if "relationships" not in char:
                    char["relationships"] = {}
                processed_characters.append(Character(**char))
            session.story_state.characters = processed_characters
            session.story_state.ending_seeds = [
                EndingSeed(**seed) for seed in result.get("ending_seeds", [])
            ]
            session.story_state.current_chapter = "开始"

            # 保存用户身份
            user_identity_data = result.get("user_identity", {"role": "侦探助理", "description": ""})
            from ..models.story_state import UserIdentity
            session.story_state.user_identity = UserIdentity(**user_identity_data)

            opening_scene = result.get("opening_scene", "")
            suggestions = result.get("suggestions", [])

            # 保存开场场景和建议到story_state
            session.story_state.opening_scene = opening_scene
            session.story_state.suggestions = suggestions

            logger.info(f"故事初始化完成，生成{len(session.story_state.characters)}个角色")

            return {
                "background": session.story_state.background,
                "characters": result.get("characters", []),
                "user_identity": user_identity_data,
                "opening_scene": opening_scene,
                "suggestions": suggestions
            }

        except Exception as e:
            logger.error(f"初始化故事失败: {e}")
            raise

    async def generate_opening_message(
        self,
        session: GameSession,
        opening_scene: str
    ) -> dict[str, Any]:
        """
        生成开场角色扮演消息（已废弃，保留用于兼容）

        Args:
            session: 游戏会话
            opening_scene: 开场场景

        Returns:
            包含角色消息和选项的字典
        """
        try:
            # 获取主角色（通常是第一个角色）
            main_character = session.story_state.characters[0] if session.story_state.characters else None

            if not main_character:
                logger.warning("没有找到角色，使用默认探长")
                main_character = Character(
                    id="detective_lin",
                    name="林默",
                    description="一位经验丰富的侦探",
                    personality="冷静严谨，观察力敏锐",
                    speaking_style="说话简洁，逻辑性强",
                    avatar=None,
                    last_speak_time=None
                )

            # 生成开场角色扮演消息
            prompt = get_opening_roleplay_prompt(
                character_name=main_character.name,
                character_description=main_character.description,
                background=session.story_state.background,
                opening_scene=opening_scene,
                user_identity=session.story_state.user_identity.model_dump() if session.story_state.user_identity else {"role": "侦探助理", "description": ""}
            )

            result = await self.llm_service.call_llm_json(prompt)

            logger.info(f"生成开场消息: {result.get('message', '')[:50]}...")

            return result

        except Exception as e:
            logger.error(f"生成开场消息失败: {e}")
            raise

    async def generate_scene_intro(
        self,
        session: GameSession
    ) -> dict[str, Any]:
        """
        生成现场介绍消息（用户点击进入现场后调用）

        Args:
            session: 游戏会话

        Returns:
            包含角色消息和选项的字典
        """
        try:
            # 获取主角色（通常是第一个角色）
            main_character = session.story_state.characters[0] if session.story_state.characters else None

            if not main_character:
                logger.warning("没有找到角色，使用默认探长")
                main_character = Character(
                    id="detective_lin",
                    name="林默",
                    description="一位经验丰富的侦探",
                    personality="冷静严谨，观察力敏锐",
                    speaking_style="说话简洁，逻辑性强",
                    avatar=None,
                    last_speak_time=None
                )

            # 生成现场介绍消息
            prompt = get_scene_intro_prompt(
                character_name=main_character.name,
                character_description=main_character.description,
                background=session.story_state.background,
                opening_scene=session.story_state.opening_scene,
                user_identity=session.story_state.user_identity.model_dump() if session.story_state.user_identity else {"role": "侦探助理", "description": ""}
            )

            result = await self.llm_service.call_llm_json(prompt)

            logger.info(f"生成现场介绍: {result.get('message', '')[:50]}...")

            return result

        except Exception as e:
            logger.error(f"生成现场介绍失败: {e}")
            raise

    async def continue_story(
        self,
        session: GameSession,
        user_input: str
    ) -> dict[str, Any]:
        """
        继续故事，处理用户输入并生成AI回复

        Args:
            session: 游戏会话
            user_input: 用户输入

        Returns:
            包含AI回复、选项和新线索的字典
        """
        try:
            # 获取主角色
            logger.info(f"用户输入: {user_input}")
            main_character = session.story_state.characters[0] if session.story_state.characters else None
            if not main_character:
                main_character = Character(
                    id="detective_lin",
                    name="林默",
                    description="一位经验丰富的侦探",
                    personality="冷静严谨，观察力敏锐",
                    speaking_style="说话简洁，逻辑性强",
                    avatar=None,
                    last_speak_time=None
                )

            # 准备线索摘要
            logger.info(f"当前线索数量: {len(session.story_state.clues)}")
            clues_summary = self._format_clues_summary(session.story_state.clues)
            clue_count = len(session.story_state.clues)

            # 计算剩余时间（分钟）
            logger.info(f"剩余时间: {session.remaining_time}秒")
            remaining_minutes = int(session.remaining_time / 60) if session.remaining_time else 0

            # 生成对话推进Prompt
            logger.info(f"prompt:{main_character.name}, {main_character.description}, {session.story_state.background}, {session.dialogue_history.total_rounds}, {session.max_rounds}, {remaining_minutes}, {clues_summary}, {clue_count}, {user_input}")
            prompt = get_continue_prompt(
                character_name=main_character.name,
                character_description=main_character.description,
                background=session.story_state.background,
                current_round=session.dialogue_history.total_rounds,
                max_rounds=session.max_rounds,
                remaining_minutes=remaining_minutes,
                clues_summary=clues_summary,
                clue_count=clue_count,
                user_input=user_input
            )
            logger.info(f"生成继续故事Prompt: {prompt[:100]}...")
            result = await self.llm_service.call_llm_json(prompt)
            logger.info(f"生成继续故事结果: {result.get('message', '')[:50]}...")

            # 处理新线索
            new_clue = result.get("new_clue")
            if new_clue:
                clue_id = f"clue_{len(session.story_state.clues) + 1}"
                clue = Clue(
                    id=clue_id,
                    content=new_clue,
                    discovered_at=session.dialogue_history.total_rounds,
                    is_key=True  # 标记为关键线索
                )
                session.story_state.add_clue(clue)
                logger.info(f"发现新线索: {new_clue[:50]}...")

            # logger.info(f"继续故事，AI回复: {result.get('message', '')[:50]}...")

            return result

        except Exception as e:
            logger.error(f"继续故事失败: {e}")
            raise


    def _format_clues_summary(self, clues: List[Clue]) -> str:
        """
        格式化线索摘要

        Args:
            clues: 线索列表

        Returns:
            格式化的线索摘要字符串
        """
        if not clues:
            return "暂无发现任何线索"

        summary_lines = []
        for i, clue in enumerate(clues, 1):
            summary_lines.append(f"{i}. {clue.content}")

        return "\n".join(summary_lines)

    async def generate_context_summary(self, session: GameSession) -> str:
        """
        生成上下文摘要

        Args:
            session: 游戏会话

        Returns:
            上下文摘要字符串
        """
        try:
            # 获取最近的对话历史
            recent_messages = session.dialogue_history.get_recent_messages(20)

            # 格式化对话历史
            dialogue_text = ""
            for msg in recent_messages:
                if msg.role.value == "user":
                    dialogue_text += f"玩家: {msg.content}\n"
                else:
                    dialogue_text += f"角色: {msg.content}\n"

            # 生成摘要
            prompt = get_summary_prompt(dialogue_text)
            summary = await self.llm_service.call_llm(prompt)

            # 更新会话的摘要
            session.story_state.context_summary = summary

            logger.info(f"生成上下文摘要: {summary[:50]}...")

            return summary

        except Exception as e:
            logger.error(f"生成上下文摘要失败: {e}")
            raise


# 全局故事服务实例
_story_service: Optional[StoryService] = None


def get_story_service() -> StoryService:
    """获取故事服务单例"""
    global _story_service
    if _story_service is None:
        _story_service = StoryService()
    return _story_service