import math
import pytest
from app.config import SOLUTIONS_LIST
from app.core.entropy_solver import (
    compute_entropy_for_word,
    filter_candidates,
    get_top_recommendations,
)


def test_entropy_opening_word_bits():
    """Verify opening Shannon entropy for canonical top opener SOARE against solutions."""
    ent, exp_rem, is_cand, win_prob = compute_entropy_for_word("soare", SOLUTIONS_LIST)
    # Canonical value from 3Blue1Brown analysis: ~5.885 bits
    assert 5.80 <= ent <= 5.95, f"Entropy for SOARE was {ent}"
    assert exp_rem < 70.0


def test_entropy_zero_on_single_candidate():
    """When only 1 candidate remains, entropy must be 0.0 bits."""
    ent, exp_rem, is_cand, win_prob = compute_entropy_for_word("crane", ["crane"])
    assert ent == 0.0
    assert exp_rem == 1.0
    assert is_cand is True
    assert win_prob == 1.0


def test_entropy_candidate_shrinkage():
    """Verify that filtering candidates prunes the set correctly."""
    pool = ["cater", "water", "hater", "later", "eater"]
    # If target is cater, and guess is cater -> 5 greens
    filtered = filter_candidates("cater", ["green"] * 5, pool)
    assert filtered == ["cater"]

    # If guess is eater against cater:
    # EATER vs CATER:
    # E: gray (index 3 in cater is already matched by E)
    # A: green
    # T: green
    # E: green
    # R: green
    # Result: ['gray', 'green', 'green', 'green', 'green']
    pattern = ["gray", "green", "green", "green", "green"]
    filtered_eater = filter_candidates("eater", pattern, pool)
    assert "cater" in filtered_eater
    assert "water" in filtered_eater
    assert "hater" in filtered_eater
    assert "later" in filtered_eater
    assert "eater" not in filtered_eater


def test_top_recommendations_structure():
    """Verify that get_top_recommendations returns well-formed objects."""
    candidates = ["cater", "water", "hater"]
    recs = get_top_recommendations(candidates, top_k=3)
    assert len(recs) <= 3
    for r in recs:
        assert "word" in r
        assert "entropy_bits" in r
        assert "expected_remaining" in r
        assert "is_candidate" in r
        assert "win_probability" in r
