"""
Mulberry32 Deterministic PRNG and Daily Seed Generator
Provides identical cross-platform pseudo-random number streams
in Python and JavaScript for synchronized daily challenges.
"""
from datetime import datetime, timezone
from typing import List

from app.config import (
    MODE_TARGET_COUNTS,
    SOLUTIONS_LIST,
)


def _imul(a: int, b: int) -> int:
    return ((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF


class Mulberry32:
    """32-bit deterministic PRNG matching JavaScript's Mulberry32 implementation."""

    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def next(self) -> float:
        """Returns float in [0.0, 1.0)."""
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.state
        t = _imul(t ^ (t >> 15), t | 1)
        t = (t ^ (t + _imul(t ^ (t >> 7), t | 61))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0

    def next_int(self, min_val: int, max_val_exclusive: int) -> int:
        """Returns integer in [min_val, max_val_exclusive)."""
        span = max_val_exclusive - min_val
        return min_val + int(self.next() * span)


def get_daily_seed(date_str: str, mode: str) -> int:
    """Generates 32-bit unsigned integer hash from date string and mode identifier."""
    s = f"wordle-infinite-{mode.lower()}-{date_str}"
    h = 0
    for char in s:
        h = (((h << 5) - h) + ord(char)) & 0xFFFFFFFF
        if h >= 0x80000000:
            h = -((~h & 0xFFFFFFFF) + 1)
    return h & 0xFFFFFFFF


def get_daily_targets(
    date_str: str,
    mode: str,
    word_list: List[str] | None = None,
) -> List[str]:
    """
    Selects deterministic unique target words for the given date and mode.
    Count matches the modality (1 for classic, 2 for dordle, 4 for quordle, 8 for octordle).
    """
    if word_list is None:
        word_list = SOLUTIONS_LIST

    seed = get_daily_seed(date_str, mode)
    rng = Mulberry32(seed)

    count = MODE_TARGET_COUNTS.get(mode.lower(), 1)
    pool = list(word_list)
    targets: List[str] = []

    for _ in range(count):
        if not pool:
            break
        idx = rng.next_int(0, len(pool))
        targets.append(pool.pop(idx))

    return targets


def get_today_str() -> str:
    """Returns today's date in 'YYYY-MM-DD' format (UTC)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")
