"""
Absurdle module alias pointing to absurdle_engine.
"""
from app.core.absurdle_engine import (
    absurdle_turn,
    information_cost,
)

__all__ = [
    "absurdle_turn",
    "information_cost",
]
