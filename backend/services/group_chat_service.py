"""
群聊调度服务
负责调度AI角色发言顺序和时机
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import json
from loguru import logger

from ..models.session import GameSession
from ..models.story_state import Character
from ..models.dialogue import DialogueMessage, MessageRole
from .character_service import get_character_service
from .llm_service import get_llm_service
from ..prompts import get_group_chat_scheduler_prompt, get_character_speech_prompt

class GroupChatService:
    """群聊调度服务"""

    def __init__(self):
        self.character_service = get_character_service()
        self.llm_service = get_llm_service()
        # 发言冷却时间（秒）
        self.speak_cooldown = 15
        # 每轮用户消息后最大AI发言数
        self.max_speeches_per_round = 5
        # 空闲触发发言时间（秒）
        self.idle_trigger_time = 30

    async def schedule_speeches_after_user_message(self, session: GameSession, user_message: DialogueMessage) -> List[str]:
        """用户发送消息后，调度需要发言的角色"""
        # 解析提及的角色
        mentioned_ids = user_message.mentioned_characters

        # 调用LLM判断需要发言的角色
        scheduler_prompt = self._build_scheduler_prompt(session, user_message)
        logger.info("调用群聊调度器LLM...")
        llm_response = await self.llm_service.generate_response(
            prompt=scheduler_prompt,
            temperature=0.3,
            response_format="json"
        )

        logger.info(f"调度器LLM响应: {llm_response}")

        # 构建角色名称到ID的映射
        active_chars = self.character_service.get_active_characters(session)
        name_to_id = {char.name: char.id for char in active_chars}
        logger.info(f"角色名称到ID映射: {name_to_id}")

        try:
            schedule_result = json.loads(llm_response)
            logger.info(f"解析后的调度结果: {schedule_result}")

            # 提取并转换角色ID（支持名称或ID）
            scheduled_char_ids = []
            for item in schedule_result[:3]:  # 最多取3个
                char_identifier = item["character_id"]
                # 如果是名称，转换成ID
                if char_identifier in name_to_id:
                    scheduled_char_ids.append(name_to_id[char_identifier])
                else:
                    # 假设已经是ID
                    scheduled_char_ids.append(char_identifier)

            logger.info(f"提取的角色ID: {scheduled_char_ids}")
        except Exception as e:
            logger.warning(f"解析调度器响应失败: {e}, 使用默认策略")
            # 解析失败时使用默认策略：提及的角色 + 高优先级角色
            scheduled_char_ids = mentioned_ids.copy()
            active_chars = self.character_service.get_active_characters(session)
            # 按优先级排序
            active_chars.sort(key=lambda x: x.priority)
            for char in active_chars:
                if char.id not in scheduled_char_ids and len(scheduled_char_ids) < 3:
                    scheduled_char_ids.append(char.id)

        # 过滤掉冷却中的角色
        logger.info(f"开始过滤角色，原始列表: {scheduled_char_ids}")
        filtered_ids = []
        now = datetime.now()
        for char_id in scheduled_char_ids:
            char = self.character_service.get_character_by_id(session, char_id)
            logger.info(f"检查角色 {char_id}: char={char}, is_active={char.is_active if char else 'N/A'}")
            if char and char.is_active:
                cooldown_ok = not char.last_speak_time or (now - char.last_speak_time) > timedelta(seconds=self.speak_cooldown)
                logger.info(f"角色 {char_id} 冷却检查: last_speak={char.last_speak_time}, cooldown_ok={cooldown_ok}")
                if cooldown_ok:
                    filtered_ids.append(char_id)
                else:
                    logger.info(f"角色 {char_id} 在冷却中，跳过")
            else:
                logger.info(f"角色 {char_id} 无效或不活跃，跳过")

        logger.info(f"过滤后的角色列表: {filtered_ids}")

        # 避免同一角色连续发言
        if filtered_ids and filtered_ids[0] == session.last_speaker and len(filtered_ids) > 1:
            logger.info(f"避免角色连续发言，移除第一个: {filtered_ids[0]}")
            filtered_ids.pop(0)

        # 添加到待发言队列
        logger.info(f"添加到待发言队列前: {session.current_speaker_queue}")
        session.current_speaker_queue.extend(filtered_ids)
        # 去重
        session.current_speaker_queue = list(dict.fromkeys(session.current_speaker_queue))
        # 限制队列长度
        if len(session.current_speaker_queue) > self.max_speeches_per_round:
            session.current_speaker_queue = session.current_speaker_queue[:self.max_speeches_per_round]

        logger.info(f"最终待发言队列: {session.current_speaker_queue}")
        return session.current_speaker_queue

    async def get_next_speech(self, session: GameSession) -> Optional[DialogueMessage]:
        """获取下一个角色的发言"""
        logger.info(f"当前待发言队列: {session.current_speaker_queue}")
        if not session.current_speaker_queue:
            logger.info("待发言队列为空")
            return None

        character_id = session.current_speaker_queue.pop(0)
        logger.info(f"从队列中取出角色: {character_id}")
        character = self.character_service.get_character_by_id(session, character_id)

        if not character or not character.is_active:
            logger.warning(f"角色无效或不活跃: {character_id}, 跳过")
            return await self.get_next_speech(session)  # 跳过无效角色

        # 生成角色回复
        logger.info(f"为角色 {character.name} 生成发言...")
        speech_prompt = self._build_character_speech_prompt(session, character)
        response_content = await self.llm_service.generate_response(
            prompt=speech_prompt,
            temperature=0.7
        )
        logger.info(f"角色 {character.name} 发言内容: {response_content}")

        # 解析回复中的@提及
        mentioned_ids = self.character_service.parse_mentioned_characters(session, response_content)

        # 创建消息
        message_id = f"msg_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
        message = DialogueMessage(
            id=message_id,
            role=MessageRole.ASSISTANT,
            sender_id=character.id,
            sender_name=character.name,
            sender_avatar=character.avatar,
            content=response_content,
            options=None,
            mentioned_characters=mentioned_ids,
            message_type="text"
        )

        # 更新角色最后发言时间
        self.character_service.update_last_speak_time(session, character_id)
        session.last_speaker = character_id

        # 如果有被@的角色，添加到队列头部
        for mentioned_id in mentioned_ids:
            if mentioned_id not in session.current_speaker_queue:
                session.current_speaker_queue.insert(0, mentioned_id)

        return message

    async def schedule_idle_speech(self, session: GameSession) -> Optional[DialogueMessage]:
        """空闲时触发关键角色发言"""
        if session.current_speaker_queue:
            return None  # 队列中还有待发言角色，不需要触发

        # 检查是否空闲时间足够
        last_message = session.dialogue_history.messages[-1] if session.dialogue_history.messages else None
        if not last_message:
            return None

        now = datetime.now()
        if (now - last_message.timestamp) < timedelta(seconds=self.idle_trigger_time):
            return None

        # 选择最高优先级的角色发言
        active_chars = self.character_service.get_active_characters(session)
        if not active_chars:
            return None

        # 按优先级排序，排除冷却中的角色
        active_chars.sort(key=lambda x: x.priority)
        selected_char = None
        for char in active_chars:
            if not char.last_speak_time or (now - char.last_speak_time) > timedelta(seconds=self.speak_cooldown):
                selected_char = char
                break

        if not selected_char:
            return None

        # 生成引导发言
        prompt = f"""
        你是{selected_char.name}，现在群聊已经冷场了，请主动说些话来推进剧情发展。
        可以询问其他人问题，或者分享你知道的线索，或者引导大家讨论当前的疑点。
        发言要符合你的性格：{selected_char.personality}
        说话风格：{selected_char.speaking_style}
        不要太长，1-2句话即可。
        """

        response_content = await self.llm_service.generate_response(
            prompt=prompt,
            temperature=0.8
        )

        # 创建消息
        message_id = f"msg_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
        message = DialogueMessage(
            id=message_id,
            role=MessageRole.ASSISTANT,
            sender_id=selected_char.id,
            sender_name=selected_char.name,
            sender_avatar=selected_char.avatar,
            content=response_content,
            options=None,
            mentioned_characters=[],
            message_type="text"
        )

        # 更新角色最后发言时间
        self.character_service.update_last_speak_time(session, selected_char.id)
        session.last_speaker = selected_char.id

        return message

    def _build_scheduler_prompt(self, session: GameSession, user_message: DialogueMessage) -> str:
        """构建调度器prompt"""
        # 获取最近10条消息
        recent_messages = session.dialogue_history.get_recent_messages(10)
        messages_str = "\n".join([f"[{msg.sender_name}]: {msg.content}" for msg in recent_messages])

        # 获取活跃角色列表，包含更完整的信息
        active_chars = self.character_service.get_active_characters(session)
        chars_info_list = []
        for char in active_chars:
            char_info = f"ID: {char.id}\n"
            char_info += f"名称: {char.name}\n"
            char_info += f"优先级: {char.priority}\n"
            char_info += f"背景: {char.description}\n"
            char_info += f"性格: {char.personality}\n"
            if char.known_clues:
                char_info += f"掌握线索: {', '.join(char.known_clues[:3])}\n"
            chars_info_list.append(char_info)
        chars_str = "\n---\n".join(chars_info_list)

        # 确保context_summary有内容
        story_context = session.story_state.context_summary or session.story_state.background or "故事正在进行中"

        return get_group_chat_scheduler_prompt(
            recent_messages=messages_str,
            current_story_state=story_context,
            characters_info=chars_str,
            user_message=user_message.content
        )

    def _build_character_speech_prompt(self, session: GameSession, character: Character) -> str:
        """构建角色发言prompt"""
        # 获取最近20条消息
        recent_messages = session.dialogue_history.get_recent_messages(20)
        messages_str = "\n".join([f"[{msg.sender_name}]: {msg.content}" for msg in recent_messages])

        # 构建角色关系描述
        relationships_str = ""
        for target_id, relation in character.relationships.items():
            target_char = self.character_service.get_character_by_id(session, target_id)
            if target_char:
                relationships_str += f"- 你和{target_char.name}的关系：{relation}\n"

        # 构建线索列表
        clues_str = "\n".join([f"- {clue}" for clue in character.known_clues]) if character.known_clues else "暂无特定线索"

        # 确保剧情进展有内容
        story_progress = session.story_state.current_chapter or "调查刚开始"

        return get_character_speech_prompt(
            character_name=character.name,
            character_description=character.description,
            personality=character.personality,
            speaking_style=character.speaking_style,
            known_clues=clues_str,
            relationships=relationships_str,
            recent_chat_history=messages_str,
            current_story_progress=story_progress
        )


# 单例实例
_group_chat_service = GroupChatService()

def get_group_chat_service() -> GroupChatService:
    """获取群聊服务单例"""
    return _group_chat_service
