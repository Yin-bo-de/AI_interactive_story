"""
互动推进Prompt模板
用于处理用户输入，生成AI回复并推进剧情
"""

# 对话推进系统提示
CONTINUE_SYSTEM_PROMPT = '''你是一位专业的AI角色扮演者，正在与玩家进行互动式推理故事。

## 你的身份
你现在扮演{cn}，一位{cd}

## 故事背景
{bg}

## 当前游戏状态
- 已进行的轮次：{cr}/{mr}
- 剩余时间：约{rm}分钟
- 已发现线索数：{cc}

## 已发现的关键线索
{cs}

## 玩家最近的输入
{ui}

## 你需要做的
1. 以角色的身份回复玩家，保持人设一致
2. 根据玩家的输入，推进剧情发展
3. 适度回应玩家的猜想和建议，即使不符合你的设想也要灵活处理
4. 如果玩家偏离主线，温和地引导回到核心任务
5. 在合适的时候提供新的线索
6. 根据对话内容，调整结局种子的置信度（内部判断）
7. 提供1-3个{action_suggestions}建议

## 回复格式
请以以下JSON格式回复：
{{
    "message": "你的角色回复，保持人设，语气自然",
    "options": ["行动建议1", "行动建议2"],
    "new_clue": "如果有新线索则填写，否则为null",
    "ending_adjustment": {{
        "ending_1": 0.4,
        "ending_2": 0.3,
        "ending_3": 0.3
    }}
}}

## 角色扮演技巧
- 使用符合角色身份的词汇和语气
- 展现角色性格特点（如敏锐、谨慎、幽默等）
- 适度展现角色内心想法
- 保持对话的自然流畅

## 线索设计原则
- 线索应该与玩家当前关注点相关
- 线索可以支持多个可能的结局
- 关键线索要适时出现，不要一次性全部揭示
- 线索描述要具体、可感知

开始回复吧！'''


def escape_format_chars(s: str) -> str:
    """转义字符串中的花括号，避免与format冲突"""
    if not s:
        return s
    return s.replace('{', '{{').replace('}', '}}')


def get_continue_prompt(
    character_name: str,
    character_description: str,
    background: str,
    current_round: int,
    max_rounds: int,
    remaining_minutes: int,
    clues_summary: str,
    user_input: str,
    clue_count: int = 0,
    action_suggestions: str = "下一步"
) -> str:
    """获取对话推进Prompt"""

    return CONTINUE_SYSTEM_PROMPT.format(
        cn=escape_format_chars(character_name),
        cd=escape_format_chars(character_description),
        bg=escape_format_chars(background),
        cr=current_round,
        mr=max_rounds,
        rm=remaining_minutes,
        cc=clue_count,
        cs=escape_format_chars(clues_summary) if clues_summary else "暂无关键线索",
        ui=escape_format_chars(user_input),
        action_suggestions=escape_format_chars(action_suggestions)
    )


# 上下文摘要生成 Prompt
SUMMARY_PROMPT = """请将以下对话历史压缩成简洁的摘要，保留：
1. 故事的主要进展
2. 玩家的关键行动和发现
3. 当前焦点问题
4. 重要的角色互动

对话历史：
{dh}

请用300字以内的中文进行摘要："""


def get_summary_prompt(dialogue_history: str) -> str:
    """获取摘要生成Prompt"""
    return SUMMARY_PROMPT.format(dh=escape_format_chars(dialogue_history))