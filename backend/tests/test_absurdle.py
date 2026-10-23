import pytest
from app.config import SOLUTIONS_LIST
from app.core.absurdle_engine import absurdle_turn, information_cost
from app.core.evaluator import encode_pattern


def test_absurdle_first_guess_maximizes_bucket():
    """
    On Turn 1 with 2,315 words, guessing XYLYL forces the AI into the largest bucket,
    which is all gray (words with no X, Y, or L), leaving 1,334 words.
    Guessing ADIEU chooses its largest bucket (pattern with yellow A, leaving 284 words).
    """
    chosen_pattern, remaining_words, is_won = absurdle_turn("XYLYL", SOLUTIONS_LIST)
    assert not is_won
    assert chosen_pattern == ["gray", "gray", "gray", "gray", "gray"]
    assert len(remaining_words) == 1334

    pattern_adieu, rem_adieu, _ = absurdle_turn("ADIEU", SOLUTIONS_LIST)
    assert pattern_adieu == ["yellow", "gray", "gray", "gray", "gray"]
    assert len(rem_adieu) == 284


def test_absurdle_tie_breaking():
    """
    Tie breaker must choose bucket with least information (min greens, then min yellows).
    """
    # Create two artificial buckets of same size
    p1 = ["green", "gray", "gray", "gray", "gray"]
    p2 = ["yellow", "gray", "gray", "gray", "gray"]
    i1 = encode_pattern(p1)
    i2 = encode_pattern(p2)

    cost1 = information_cost(i1)  # (1, 0, ...)
    cost2 = information_cost(i2)  # (0, 1, ...)
    assert cost2 < cost1  # yellow has 0 greens vs 1 green


def test_absurdle_terminal_condition():
    """When pool is forced to 1 word and guessed, Absurdle yields 5 greens and victory."""
    chosen_pattern, remaining_words, is_won = absurdle_turn("SLOTH", ["sloth"])
    assert is_won is True
    assert chosen_pattern == ["green", "green", "green", "green", "green"]
    assert remaining_words == ["sloth"]
