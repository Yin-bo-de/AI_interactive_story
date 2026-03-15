"""
游戏结束Prompt模板
用于生成最终结局
"""


def escape_format_chars(s: str) -> str:
    """转义字符串中的花括号，避免与format冲突"""
    if not s:
        return s
    return s.replace('{', '{{').replace('}', '}}')


# 游戏结束系统提示
END_SYSTEM_PROMPT = '''你是一位专业的推理故事创作者，现在要为这个互动式推理游戏生成最终结局。

## 故事背景
{bg}

## 角色信息
{ci}

## 选定的结局方向
{se}

## 玩家的关键发现和行动
{pa}

## 已发现的关键线索
{kc}

## 游戏统计
- 总轮次：{tr}
- 游戏时长：{dm}分钟

## 结局要求
1. 根据选定的结局种子，生成一个完整的、逻辑自洽的结局
2. 回顾玩家在游戏中的贡献和关键发现
3. 揭示真相，解释所有关键线索
4. 给出角色对玩家的评价
5. 结局应该给人一种满足感，呼应前面的剧情

## 回复格式
请以以下JSON格式回复：
{{
    "ending_title": "结局标题（如：真相大白、迷雾重重等）",
    "ending_story": "完整的结局叙述，包括真相揭示、线索解释、角色反应等",
    "truth_revealed": "真相的核心内容",
    "clues_explanation": "对关键线索的逐一解释",
    "player_evaluation": "对玩家表现的评价和感谢",
    "rating": 9.5
}}

## 结局写作技巧
- 使用富有感染力的语言，营造氛围
- 倒叙或插叙回顾关键情节，增强戏剧性
- 给玩家一种"原来如此"的顿悟感
- 结局要符合故事的整体基调

开始创作结局吧！'''


def get_end_prompt(
    background: str,
    characters_info: str,
    selected_ending: str,
    player_actions: str,
    key_clues: str,
    total_rounds: int,
    duration_minutes: float
) -> str:
    """获取游戏结束Prompt"""
    return END_SYSTEM_PROMPT.format(
        bg=escape_format_chars(background),
        ci=escape_format_chars(characters_info),
        se=escape_format_chars(selected_ending),
        pa=escape_format_chars(player_actions),
        kc=escape_format_chars(key_clues),
        tr=total_rounds,
        dm=round(duration_minutes, 1)
    )


# 结局选择 Prompt（用于在游戏结束时评估哪个结局最合适）
ENDING_SELECTION_PROMPT = """根据以下信息，从3个可能的结局种子中选择最合适的一个作为最终结局。

## 故事背景
{bg}

## 玩家在游戏中的关键行为和发现
{pa}

## 已发现的线索
{cs}

## 3个可能的结局种子
1. {e1}
2. {e2}
3. {e3}

请分析玩家的行为、发现的线索和对话趋势，判断哪个结局最符合故事发展的逻辑。

请直接回复选中的结局ID（如 "ending_1"）："""


def get_ending_selection_prompt(
    background: str,
    player_actions: str,
    clues_summary: str,
    ending_1: str,
    ending_2: str,
    ending_3: str
) -> str:
    """获取结局选择Prompt"""
    return ENDING_SELECTION_PROMPT.format(
        bg=escape_format_chars(background),
        pa=escape_format_chars(player_actions),
        cs=escape_format_chars(clues_summary),
        e1=escape_format_chars(ending_1),
        e2=escape_format_chars(ending_2),
        e3=escape_format_chars(ending_3)
    )
