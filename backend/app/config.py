import json
import os
from pathlib import Path
from typing import Dict, List, Set

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

WORD_LENGTH = 5

MODE_MAX_GUESSES = {
    "classic": 6,
    "dordle": 7,
    "quordle": 9,
    "octordle": 13,
    "absurdle": 999,
}

MODE_TARGET_COUNTS = {
    "classic": 1,
    "dordle": 2,
    "quordle": 4,
    "octordle": 8,
    "absurdle": 1,
}

def load_json_file(filepath: Path) -> list:
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# Load wordlists
SOLUTIONS_LIST: List[str] = [
    w.lower() for w in (load_json_file(DATA_DIR / "words_solutions.json") or load_json_file(DATA_DIR / "solutions.json"))
]
SOLUTIONS_SET: Set[str] = set(SOLUTIONS_LIST)

GUESSES_LIST: List[str] = [
    w.lower() for w in (load_json_file(DATA_DIR / "words_guesses.json") or load_json_file(DATA_DIR / "allowed_guesses.json"))
]
GUESSES_SET: Set[str] = set(GUESSES_LIST)

# Full valid words (2315 + 12540 = 14855)
VALID_WORDS_SET: Set[str] = SOLUTIONS_SET | GUESSES_SET
ALL_WORDS_LIST: List[str] = sorted(list(VALID_WORDS_SET))

OPENING_ENTROPY_LIST: List[dict] = load_json_file(DATA_DIR / "opening_entropy.json")
