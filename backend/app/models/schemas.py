"""
Pydantic Schemas for Wordle Infinite API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class WordValidateRequest(BaseModel):
    word: str = Field(..., min_length=5, max_length=5, description="5-letter word to validate")


class WordValidateResponse(BaseModel):
    word: str
    is_valid: bool
    error_message: Optional[str] = None


class DailyConfigRequest(BaseModel):
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format, defaults to today UTC")
    mode: str = Field("classic", description="classic, dordle, quordle, octordle, or absurdle")


class DailyConfigResponse(BaseModel):
    date: str
    mode: str
    targets: List[str]
    max_guesses: int


class GuessRequest(BaseModel):
    guess: str = Field(..., min_length=5, max_length=5, description="5-letter guess word")
    targets: List[str] = Field(..., min_length=1, description="List of target words for active boards")


class EvaluationResult(BaseModel):
    target_index: int
    pattern: List[str]
    is_solved: bool


class EvaluateResponse(BaseModel):
    guess: str
    is_valid_word: bool
    evaluations: List[EvaluationResult]


class EntropyHintRequest(BaseModel):
    candidate_words: List[str] = Field(..., description="Currently remaining candidate solution words")
    top_k: int = Field(10, ge=1, le=50, description="Number of top hints to return")


class EntropyRecommendation(BaseModel):
    word: str
    entropy_bits: float
    expected_remaining: float
    is_candidate: bool
    win_probability: float


class EntropyHintResponse(BaseModel):
    candidate_count: int
    top_recommendations: List[EntropyRecommendation]


class AbsurdleGuessRequest(BaseModel):
    guess: str = Field(..., min_length=5, max_length=5, description="5-letter guess word")
    candidate_words: Optional[List[str]] = Field(None, description="Remaining candidate pool, defaults to full 2315 solutions")


class AbsurdleStepResponse(BaseModel):
    guess: str
    chosen_pattern: List[str]
    remaining_count: int
    remaining_words: List[str]
    is_game_won: bool


class HardModeValidateRequest(BaseModel):
    current_guess: str = Field(..., min_length=5, max_length=5)
    prior_guesses: List[str] = Field(default_factory=list)
    prior_evaluations: List[List[str]] = Field(default_factory=list)


class HardModeValidateResponse(BaseModel):
    is_valid: bool
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    solutions_count: int
    valid_guesses_count: int
    total_words: int
