"""AI Prompt模板包"""

from .init_prompt import (
    get_init_prompt,
    get_opening_roleplay_prompt,
    get_scene_intro_prompt
)
from .continue_prompt import (
    get_continue_prompt,
    get_summary_prompt
)
from .end_prompt import (
    get_end_prompt,
    get_ending_selection_prompt
)

__all__ = [
    "get_init_prompt",
    "get_opening_roleplay_prompt",
    "get_scene_intro_prompt",
    "get_continue_prompt",
    "get_summary_prompt",
    "get_end_prompt",
    "get_ending_selection_prompt",
]
