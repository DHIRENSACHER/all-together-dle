import pytest
from app.core.prng import (
    Mulberry32,
    get_daily_seed,
    get_daily_targets,
)


def test_prng_same_date_same_words():
    """Identical date and mode must produce identical targets deterministically."""
    date_str = "2026-10-23"
    t1 = get_daily_targets(date_str, "classic")
    t2 = get_daily_targets(date_str, "classic")
    assert t1 == t2
    assert len(t1) == 1

    q1 = get_daily_targets(date_str, "quordle")
    q2 = get_daily_targets(date_str, "quordle")
    assert q1 == q2
    assert len(q1) == 4
    # All 4 target words must be distinct
    assert len(set(q1)) == 4


def test_prng_different_modes_distinct_words():
    """Different modes on the same day generate distinct seed streams."""
    date_str = "2026-10-23"
    seed_classic = get_daily_seed(date_str, "classic")
    seed_dordle = get_daily_seed(date_str, "dordle")
    seed_quordle = get_daily_seed(date_str, "quordle")

    assert seed_classic != seed_dordle
    assert seed_dordle != seed_quordle


def test_mulberry32_stream():
    """Verify reproducible float generation in [0, 1)."""
    rng = Mulberry32(42)
    val1 = rng.next()
    val2 = rng.next()
    assert 0.0 <= val1 < 1.0
    assert 0.0 <= val2 < 1.0
    assert val1 != val2

    # Re-initialized with same seed must match
    rng_again = Mulberry32(42)
    assert rng_again.next() == val1
    assert rng_again.next() == val2
