"""
Absurdle Adversarial Bucketing Engine
Minimax Equivalence Partitioning across all 3^5 = 243 feedback patterns.
Dynamically evades victory by picking the largest equivalence bucket,
with deterministic minimax tie-breaking (minimum greens, minimum yellows, lowest index).
"""
from typing import Dict, List, Tuple

from app.core.evaluator import (
    decode_pattern,
    evaluate_pattern_int,
)


def information_cost(pat_int: int) -> Tuple[int, int, int]:
    """
    Calculates tie-breaker information cost:
    (greens_count, yellows_count, pat_int)
    Minimizing this chooses the pattern that awards the player the least information.
    """
    pattern = decode_pattern(pat_int)
    greens = sum(1 for c in pattern if c == "green")
    yellows = sum(1 for c in pattern if c == "yellow")
    return (greens, yellows, pat_int)


def absurdle_turn(
    guess: str,
    candidate_words: List[str],
) -> Tuple[List[str], List[str], bool]:
    """
    Executes one turn of adversarial bucketing.
    Returns:
        (chosen_pattern, remaining_words, is_game_won)
    """
    g = guess.lower()

    # 1. Edge case: exactly one word left and player guessed it!
    if len(candidate_words) == 1 and candidate_words[0].lower() == g:
        return ["green", "green", "green", "green", "green"], candidate_words, True

    # 2. Partition candidate words into buckets by ternary pattern int
    buckets: Dict[int, List[str]] = {}
    for word in candidate_words:
        pat_index = evaluate_pattern_int(g, word)
        if pat_index not in buckets:
            buckets[pat_index] = []
        buckets[pat_index].append(word)

    if not buckets:
        return ["gray"] * 5, [], False

    # 3. Find maximum bucket size
    max_size = max(len(b) for b in buckets.values())
    largest_buckets = [pat for pat, b in buckets.items() if len(b) == max_size]

    # 4. Deterministic Minimax Tie-Breaker
    best_pat_index = min(largest_buckets, key=information_cost)
    chosen_pattern = decode_pattern(best_pat_index)
    remaining_words = buckets[best_pat_index]

    # 5. Check victory: all greens pattern (242)
    is_game_won = (best_pat_index == 242)

    return chosen_pattern, remaining_words, is_game_won
