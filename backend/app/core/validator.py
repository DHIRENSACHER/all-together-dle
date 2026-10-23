"""
Validator module alias pointing to hard_mode.
"""
from app.core.hard_mode import (
    validate_hard_mode,
    validate_word_in_dictionary,
)

__all__ = [
    "validate_hard_mode",
    "validate_word_in_dictionary",
]
