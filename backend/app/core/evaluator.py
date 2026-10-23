"""
Core Evaluator Module
Strict two-pass duplicate letter resolution algorithm & base-3 ternary pattern encoder/decoder.
"""
from typing import List

COLOR_MAP = {
    0: "gray",
    1: "yellow",
    2: "green",
}

REV_COLOR_MAP = {
    "gray": 0,
    "yellow": 1,
    "green": 2,
}

POWERS_OF_3 = [1, 3, 9, 27, 81]


def evaluate_guess(guess: str, target: str) -> List[str]:
    """
    Evaluates guess against target with strict duplicate letter resolution.
    Returns list of 5 colors: 'green', 'yellow', or 'gray'.
    
    Time Complexity: O(L) where L=5.
    Space Complexity: O(1).
    """
    if len(guess) != 5 or len(target) != 5:
        raise ValueError("Words must be 5 letters")
    g = guess.lower()
    t = target.lower()

    result = ["gray"] * 5
    target_counts = {}

    # Count letter occurrences in target
    for char in t:
        target_counts[char] = target_counts.get(char, 0) + 1

    # PASS 1: Identify all Greens (exact positional matches)
    for i in range(5):
        if g[i] == t[i]:
            result[i] = "green"
            target_counts[g[i]] -= 1

    # PASS 2: Identify all Yellows (present elsewhere, frequency-bounded)
    for i in range(5):
        if result[i] != "green":
            char = g[i]
            if target_counts.get(char, 0) > 0:
                result[i] = "yellow"
                target_counts[char] -= 1
            else:
                result[i] = "gray"

    return result


def evaluate_pattern_int(guess: str, target: str) -> int:
    """
    Directly computes the integer pattern code (0 <= P <= 242) for maximum speed.
    P = sum(v_i * 3^i) where v_i in {0=gray, 1=yellow, 2=green}.
    """
    if len(guess) != 5 or len(target) != 5:
        raise ValueError("Words must be 5 letters")
    g = guess.lower()
    t = target.lower()

    res = [0] * 5
    counts = {}
    for c in t:
        counts[c] = counts.get(c, 0) + 1

    # Pass 1: Greens
    for i in range(5):
        if g[i] == t[i]:
            res[i] = 2
            counts[g[i]] -= 1

    # Pass 2: Yellows
    for i in range(5):
        if res[i] == 0:
            c = g[i]
            if counts.get(c, 0) > 0:
                res[i] = 1
                counts[c] -= 1

    val = 0
    for i in range(5):
        val += res[i] * POWERS_OF_3[i]
    return val


def encode_pattern(pattern: List[str]) -> int:
    """Encodes a list of 5 color strings into an integer in [0, 242]."""
    if len(pattern) != 5:
        raise ValueError("Pattern must have length 5")
    val = 0
    for i in range(5):
        val += REV_COLOR_MAP[pattern[i]] * POWERS_OF_3[i]
    return val


def decode_pattern(pattern_int: int) -> List[str]:
    """Decodes an integer in [0, 242] into a list of 5 color strings."""
    if not (0 <= pattern_int <= 242):
        raise ValueError("Pattern integer must be between 0 and 242 inclusive")
    p = pattern_int
    res = []
    for _ in range(5):
        res.append(COLOR_MAP[p % 3])
        p //= 3
    return res
