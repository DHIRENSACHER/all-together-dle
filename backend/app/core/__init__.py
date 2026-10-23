"""
Core Algorithms Module for Wordle Infinite.
"""
from app.core.absurdle_engine import absurdle_turn
from app.core.entropy_solver import (
    filter_candidates,
    get_top_recommendations,
)
from app.core.evaluator import (
    decode_pattern,
    encode_pattern,
    evaluate_guess,
    evaluate_pattern_int,
)
from app.core.hard_mode import (
    validate_hard_mode,
    validate_word_in_dictionary,
)
from app.core.prng import (
    Mulberry32,
    get_daily_seed,
    get_daily_targets,
)

__all__ = [
    "evaluate_guess",
    "evaluate_pattern_int",
    "encode_pattern",
    "decode_pattern",
    "filter_candidates",
    "get_top_recommendations",
    "absurdle_turn",
    "Mulberry32",
    "get_daily_seed",
    "get_daily_targets",
    "validate_hard_mode",
    "validate_word_in_dictionary",
]
