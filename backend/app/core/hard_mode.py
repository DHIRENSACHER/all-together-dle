"""
Hard Mode Validator and Guess Rule Enforcement
Enforces Wordle hard mode rules:
1. Position fixed for confirmed green letters: 'Position {i+1} must be {char}'
2. Letters confirmed yellow must be included in subsequent guesses: 'Guess must contain {char}'
"""
from typing import List, Optional, Set, Tuple

from app.config import VALID_WORDS_SET


def validate_word_in_dictionary(word: str) -> Tuple[bool, Optional[str]]:
    """Checks if a guess is exactly 5 letters and present in the 14,855 master dictionary."""
    w = word.strip().lower()
    if len(w) != 5 or not w.isalpha():
        return False, "Word must be 5 letters"
    if w not in VALID_WORDS_SET:
        return False, "Not in word list"
    return True, None


def validate_hard_mode(
    current_guess: str,
    prior_guesses: List[str],
    prior_evaluations: List[List[str]],
) -> Tuple[bool, Optional[str]]:
    """
    Validates that current_guess satisfies hard mode constraints derived from all prior turns.
    Returns (is_valid, error_message).
    """
    g = current_guess.lower()
    if len(g) != 5:
        return False, "Word must be 5 letters"

    # Gather required green positions: index -> required char
    required_greens: dict[int, str] = {}
    # Gather required yellow letters: set of characters
    required_yellows: Set[str] = set()

    for guess_word, eval_colors in zip(prior_guesses, prior_evaluations):
        gw = guess_word.lower()
        for idx in range(min(len(gw), 5)):
            color = eval_colors[idx]
            if color == "green":
                required_greens[idx] = gw[idx]
            elif color == "yellow":
                required_yellows.add(gw[idx])

    # Rule 1: Check green positions
    for idx, expected_char in required_greens.items():
        if g[idx] != expected_char:
            return False, f"Position {idx + 1} must be '{expected_char.upper()}'"

    # Rule 2: Check yellow letters included
    for req_char in required_yellows:
        if req_char not in g:
            return False, f"Guess must contain '{req_char.upper()}'"

    return True, None
