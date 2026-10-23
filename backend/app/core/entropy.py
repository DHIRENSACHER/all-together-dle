"""
Entropy module alias pointing to entropy_solver.
"""
from app.core.entropy_solver import (
    compute_entropy_for_word,
    filter_candidates,
    get_top_recommendations,
)

__all__ = [
    "filter_candidates",
    "compute_entropy_for_word",
    "get_top_recommendations",
]
