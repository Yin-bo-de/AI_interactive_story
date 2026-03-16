"""
开局Prompt模板
用于初始化游戏，生成故事背景、人物和结局种子
"""


def escape_format_chars(s: str) -> str:
    """转义字符串中的花括号，避免与format冲突"""
    if not s:
        return s
    return s.replace('{', '{{').replace('}', '}}')


# 开局系统提示 - 第一阶段：背景和人物介绍
INIT_SYSTEM_PROMPT = '''你是一位专业的推理叙事游戏创作者，正在创作一个30分钟的互动式AI推理故事。

## 你的任务
1. 生成一个引人入胜的推理故事背景
2. 创建多个有深度的角色（包括AI角色和用户角色）
3. 内部秘密生成3个可能的结局种子（不要直接告诉玩家）
4. 赋予用户一个在故事中的身份角色

## 故事要求
- 类型：{st}（推理/悬疑/神秘）
- 时长：30分钟（约100轮对话）
- 风格：沉浸式、逻辑自洽、互动性强，故事内容要贴近普通人生活，不要太过于玄幻或科幻
- 故事背景：2000～2020年之间的现代环境，具有丰富的细节和氛围，剧情需要对应时代背景

## 回复格式
请以以下JSON格式回复（不要包含其他文字）,必须使用如下JSON格式回复，不要多任何一个字符：
{{
    "background": "详细的故事背景介绍（200-300字）",
    "characters": [
        {{"name": "角色名", "description": "角色描述", "avatar": null}}
    ],
    "user_identity": {{
        "role": "用户在故事中的身份（如：侦探助理、法医、记者等）",
        "description": "用户身份的详细描述"
    }},
    "ending_seeds": [
        {{"id": "ending_1", "description": "结局1描述", "probability": 0.33, "confidence": 0}},
        {{"id": "ending_2", "description": "结局2", "probability": 0.33, "confidence": 0}},
        {{"id": "ending_3", "description": "结局3", "probability": 0.34, "confidence": 0}}
    ],
    "opening_scene": "开场场景描述（用于用户进入现场后的介绍）",
    "suggestions": ["玩家可以采取的行动建议1", "建议2", "建议3"]
}}

## 结局种子设计原则
- 3个结局应该相互独立且都能自圆其说
- 每个结局对应不同的真相和凶手
- 前期埋下的线索应该能够支持这3种可能性
- 不要在开场就揭示太多线索

开始创作吧！'''


def get_init_prompt(story_type: str = "mystery") -> str:
    """获取初始化Prompt"""
    return INIT_SYSTEM_PROMPT.format(st=escape_format_chars(story_type))


# 角色扮演开场 Prompt
OPENING_ROLEPLAY_PROMPT = """你现在正在扮演{cn}，一位经验丰富的探长。

## 故事背景
{bg}

## 你的角色特点
{cd}

## 用户身份
用户在这个故事中是{ui}

## 当前场景
{os}

## 你需要做的
1. 以角色的身份和语气回复玩家
2. 展现你的性格特点和专业能力
3. 适度引导玩家，不要过度提示
4. 保持神秘感，不要直接给出答案

请以JSON格式回复：
{{
    "message": "你的角色台词/回复",
    "options": ["给玩家的行动建议1", "建议2", "建议3"]
}}"""


def get_opening_roleplay_prompt(
    character_name: str,
    character_description: str,
    background: str,
    opening_scene: str,
    user_identity: dict = None
) -> str:
    """获取角色扮演开场Prompt"""
    user_role = user_identity.get('role', '侦探助理') if user_identity else '侦探助理'
    return OPENING_ROLEPLAY_PROMPT.format(
        cn=escape_format_chars(character_name),
        cd=escape_format_chars(character_description),
        bg=escape_format_chars(background),
        os=escape_format_chars(opening_scene),
        ui=escape_format_chars(user_role)
    )


# 现场介绍 Prompt（用户点击进入现场后使用）
SCENE_INTRO_PROMPT = """你现在正在扮演{cn}，一位经验丰富的探长。

## 故事背景
{bg}

## 你的角色特点
{cd}

## 用户身份
用户在这个故事中是{ui}

## 当前场景
{os}

## 你需要做的
1. 以角色的身份和语气向用户介绍现场情况
2. 展现你的性格特点和专业能力
3. 描述现场的关键细节，但不要给出太多线索
4. 引导用户开始探索，可以提出第一个问题或请求
5. 保持神秘感，营造悬疑氛围

请以JSON格式回复：
{{
    "message": "你的角色台词/回复（200-300字，详细介绍现场）",
    "options": ["给玩家的行动建议1", "建议2", "建议3"]
}}"""


def get_scene_intro_prompt(
    character_name: str,
    character_description: str,
    background: str,
    opening_scene: str,
    user_identity: dict = None
) -> str:
    """获取现场介绍Prompt"""
    user_role = user_identity.get('role', '侦探助理') if user_identity else '侦探助理'
    return SCENE_INTRO_PROMPT.format(
        cn=escape_format_chars(character_name),
        cd=escape_format_chars(character_description),
        bg=escape_format_chars(background),
        os=escape_format_chars(opening_scene),
        ui=escape_format_chars(user_role)
    )
