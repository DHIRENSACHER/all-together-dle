import pytest
from app.core.evaluator import (
    decode_pattern,
    encode_pattern,
    evaluate_guess,
    evaluate_pattern_int,
)


def test_exact_matches_all_green():
    """All letters match exactly in position -> 5 greens."""
    result = evaluate_guess("CRANE", "CRANE")
    assert result == ["green", "green", "green", "green", "green"]
    assert evaluate_pattern_int("CRANE", "CRANE") == 242


def test_duplicate_letter_abbey_babes():
    """
    Canonical Edge Case:
    Target: ABBEY (A:1, B:2, E:1, Y:1)
    Guess:  BABES (B, A, B, E, S)
    - Pass 1: index 2 (B==B -> green), index 3 (E==E -> green). Target has left: A:1, B:1, Y:1.
    - Pass 2: index 0 (B in target -> yellow), index 1 (A in target -> yellow), index 4 (S not in target -> gray).
    Result: ['yellow', 'yellow', 'green', 'green', 'gray']
    """
    result = evaluate_guess("BABES", "ABBEY")
    assert result == ["yellow", "yellow", "green", "green", "gray"]


def test_duplicate_letter_speed_erase():
    """
    Canonical Edge Case:
    Target: SPEED (S:1, P:1, E:2, D:1)
    Guess:  ERASE (E, R, A, S, E)
    - Pass 1: no exact matches.
    - Pass 2: index 0 (E -> yellow), index 1 (R -> gray), index 2 (A -> gray), index 3 (S -> yellow), index 4 (E -> yellow).
    Result: ['yellow', 'gray', 'gray', 'yellow', 'yellow']
    """
    result = evaluate_guess("ERASE", "SPEED")
    assert result == ["yellow", "gray", "gray", "yellow", "yellow"]


def test_duplicate_letter_speed_eerie():
    """
    Canonical Edge Case:
    Target: SPEED (has 2 E's)
    Guess:  EERIE (has 3 E's: index 0, 1, 4)
    - Pass 1: index 2 (E != P), none match positionally.
    - Pass 2: index 0 (E -> yellow), index 1 (E -> yellow), index 4 (E -> gray because target has only 2 E's).
    Result: ['yellow', 'yellow', 'gray', 'gray', 'gray']
    """
    result = evaluate_guess("EERIE", "SPEED")
    assert result == ["yellow", "yellow", "gray", "gray", "gray"]


def test_duplicate_letter_geese_eerie():
    """
    Canonical Edge Case:
    Target: GEESE (G:1, E:3, S:1)
    Guess:  EERIE (E, E, R, I, E)
    - Pass 1: index 1 (E==E -> green), index 4 (E==E -> green). Left in target: G:1, E:1, S:1.
    - Pass 2: index 0 (E -> yellow), index 2 (R -> gray), index 3 (I -> gray).
    Result: ['yellow', 'green', 'gray', 'gray', 'green']
    """
    result = evaluate_guess("EERIE", "GEESE")
    assert result == ["yellow", "green", "gray", "gray", "green"]


def test_duplicate_letter_alert_llama():
    """
    Canonical Edge Case:
    Target: ALERT (A:1, L:1, E:1, R:1, T:1)
    Guess:  LLAMA (L, L, A, M, A)
    - Pass 1: index 1 (L==L -> green). Target has 0 L's left.
    - Pass 2: index 0 (L -> gray, since target count is 0).
              index 2 (A -> yellow, since target has A:1 at index 0).
              index 3 (M -> gray).
              index 4 (A -> gray, target count exhausted).
    Result: ['gray', 'green', 'yellow', 'gray', 'gray']
    """
    result = evaluate_guess("LLAMA", "ALERT")
    assert result == ["gray", "green", "yellow", "gray", "gray"]


def test_all_gray():
    """Completely disjoint words yield all gray."""
    result = evaluate_guess("FUZZY", "CRANE")
    assert result == ["gray", "gray", "gray", "gray", "gray"]
    assert evaluate_pattern_int("FUZZY", "CRANE") == 0


def test_pattern_encoder_decoder_roundtrip():
    """All 243 ternary patterns must encode and decode reversibly."""
    for p_int in range(243):
        pattern = decode_pattern(p_int)
        assert len(pattern) == 5
        encoded = encode_pattern(pattern)
        assert encoded == p_int
