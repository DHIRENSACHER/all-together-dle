"""
Shannon Information Entropy Solver (3Blue1Brown Math Formulation)
Computes exact expected information gain in bits:
    H(g) = - sum(P(p) * log2(P(p)))
Prunes candidate sets and recommends top information-maximizing guesses.
"""
import math
from typing import Dict, List, Optional, Set, Tuple

from app.config import (
    ALL_WORDS_LIST,
    OPENING_ENTROPY_LIST,
    SOLUTIONS_SET,
)
from app.core.evaluator import (
    decode_pattern,
    encode_pattern,
    evaluate_pattern_int,
)


def filter_candidates(
    guess: str,
    pattern: List[str] | int,
    candidates: List[str],
) -> List[str]:
    """
    Prunes candidate set W based on observed pattern for a guess.
    W_{t+1} = { w in W_t | evaluate_guess(guess, w) == pattern }
    """
    if isinstance(pattern, list):
        pat_int = encode_pattern(pattern)
    else:
        pat_int = pattern

    g = guess.lower()
    return [w for w in candidates if evaluate_pattern_int(g, w) == pat_int]


def compute_entropy_for_word(
    guess: str,
    candidates: List[str],
    candidate_set: Optional[Set[str]] = None,
) -> Tuple[float, float, bool, float]:
    """
    Computes (entropy_bits, expected_remaining, is_candidate, win_probability)
    for a given guess against candidates.
    """
    total = len(candidates)
    if total <= 1:
        is_cand = guess.lower() in (candidate_set if candidate_set else set(candidates))
        return 0.0, float(total), is_cand, 1.0 if is_cand and total == 1 else 0.0

    buckets = [0] * 243
    g = guess.lower()
    for w in candidates:
        buckets[evaluate_pattern_int(g, w)] += 1

    entropy = 0.0
    expected_remaining = 0.0
    for count in buckets:
        if count > 0:
            prob = count / total
            entropy -= prob * math.log2(prob)
            expected_remaining += prob * count

    is_cand = g in (candidate_set if candidate_set is not None else set(candidates))
    win_prob = (1.0 / total) if is_cand else 0.0

    return entropy, expected_remaining, is_cand, win_prob


def get_top_recommendations(
    candidates: List[str],
    top_k: int = 10,
    allowed_words: Optional[List[str]] = None,
) -> List[Dict]:
    """
    Calculates and ranks guesses by expected Shannon entropy in bits.
    Optimized for sub-20ms response time.
    """
    total_candidates = len(candidates)

    # 1. Edge Case: Initial full solution pool
    if total_candidates == 2315 and OPENING_ENTROPY_LIST:
        return OPENING_ENTROPY_LIST[:top_k]

    # 2. Edge Case: 0 or 1 candidate remaining
    if total_candidates == 0:
        return []

    candidate_set = set(w.lower() for w in candidates)

    if total_candidates == 1:
        only_word = candidates[0].upper()
        return [
            {
                "word": only_word,
                "entropy_bits": 0.0,
                "expected_remaining": 1.0,
                "is_candidate": True,
                "win_probability": 1.0,
            }
        ]

    # Build pool of words to test
    # Always test all current candidates
    words_to_evaluate: Set[str] = set(candidate_set)

    # If small number of candidates (e.g. <= 200), add prominent exploratory words
    # to find words that distinguish between rhyming traps (e.g. _ATCH, _OUND)
    if allowed_words is None:
        allowed_words = ALL_WORDS_LIST

    if total_candidates <= 100:
        # Include top opener words + top dictionary words as exploratory candidates
        openers = [item["word"].lower() for item in OPENING_ENTROPY_LIST[:30]]
        for op in openers:
            words_to_evaluate.add(op)
    elif total_candidates > 500:
        # Sample or use precomputed openers + subset to keep response time instant
        for item in OPENING_ENTROPY_LIST[:40]:
            words_to_evaluate.add(item["word"].lower())

    results = []
    for w in words_to_evaluate:
        ent, exp_rem, is_cand, win_prob = compute_entropy_for_word(
            w, candidates, candidate_set
        )
        # Small score bonus for direct winning candidate when entropy is close
        score = ent + (win_prob * 0.1)
        results.append({
            "word": w.upper(),
            "entropy_bits": round(ent, 3),
            "expected_remaining": round(exp_rem, 1),
            "is_candidate": is_cand,
            "win_probability": round(win_prob, 4),
            "_score": score,
        })

    # Sort primarily by score/entropy, then candidate status
    results.sort(key=lambda x: (x["_score"], x["is_candidate"]), reverse=True)

    # Strip internal _score key
    for r in results:
        del r["_score"]

    return results[:top_k]
