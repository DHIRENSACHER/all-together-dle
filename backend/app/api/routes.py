"""
Wordle Infinite API Endpoints (/api/v1)
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.config import (
    ALL_WORDS_LIST,
    GUESSES_SET,
    MODE_MAX_GUESSES,
    SOLUTIONS_LIST,
    SOLUTIONS_SET,
    VALID_WORDS_SET,
)
from app.core.absurdle_engine import absurdle_turn
from app.core.entropy_solver import get_top_recommendations
from app.core.evaluator import evaluate_guess
from app.core.hard_mode import (
    validate_hard_mode,
    validate_word_in_dictionary,
)
from app.core.prng import (
    get_daily_targets,
    get_today_str,
)
from app.models.schemas import (
    AbsurdleGuessRequest,
    AbsurdleStepResponse,
    DailyConfigResponse,
    EntropyHintRequest,
    EntropyHintResponse,
    EntropyRecommendation,
    EvaluateResponse,
    EvaluationResult,
    HardModeValidateRequest,
    HardModeValidateResponse,
    HealthResponse,
    GuessRequest,
    WordValidateRequest,
    WordValidateResponse,
)

router = APIRouter(prefix="/api/v1")


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint providing loaded dictionary diagnostics."""
    return HealthResponse(
        status="healthy",
        solutions_count=len(SOLUTIONS_SET),
        valid_guesses_count=len(GUESSES_SET),
        total_words=len(VALID_WORDS_SET),
    )


@router.post("/words/validate", response_model=WordValidateResponse)
def validate_word(req: WordValidateRequest):
    """Validates if a 5-letter word exists in the 14,855 master dictionary."""
    is_valid, err = validate_word_in_dictionary(req.word)
    return WordValidateResponse(
        word=req.word.upper(),
        is_valid=is_valid,
        error_message=err,
    )


@router.get("/game/daily", response_model=DailyConfigResponse)
def get_daily_challenge(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    mode: str = Query("classic", description="classic, dordle, quordle, octordle, or absurdle"),
):
    """
    Returns deterministic daily target word(s) using Mulberry32 PRNG
    keyed by date and mode.
    """
    date_str = date or get_today_str()
    mode_clean = mode.lower()
    if mode_clean not in MODE_MAX_GUESSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid game mode: '{mode}'. Supported modes: {', '.join(sorted(MODE_MAX_GUESSES.keys()))}",
        )
    targets = get_daily_targets(date_str, mode_clean, SOLUTIONS_LIST)
    max_guesses = MODE_MAX_GUESSES.get(mode_clean, 6)

    return DailyConfigResponse(
        date=date_str,
        mode=mode_clean,
        targets=[t.upper() for t in targets],
        max_guesses=max_guesses,
    )


@router.post("/game/evaluate", response_model=EvaluateResponse)
def evaluate_guess_targets(req: GuessRequest):
    """
    Evaluates a guess against one or more target words with strict two-pass resolution.
    Returns per-target coloring and solved status.
    """
    g = req.guess.strip().lower()
    is_valid, _ = validate_word_in_dictionary(g)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Word not in dictionary")

    evaluations: list[EvaluationResult] = []
    for idx, target in enumerate(req.targets):
        t = target.strip().lower()
        if len(t) != 5:
            continue
        pattern = evaluate_guess(g, t)
        is_solved = (g == t)
        evaluations.append(
            EvaluationResult(
                target_index=idx,
                pattern=pattern,
                is_solved=is_solved,
            )
        )

    return EvaluateResponse(
        guess=g.upper(),
        is_valid_word=True,
        evaluations=evaluations,
    )


@router.post("/game/hard-mode/validate", response_model=HardModeValidateResponse)
def validate_hard_mode_guess(req: HardModeValidateRequest):
    """Checks whether current guess complies with hard mode constraints."""
    is_valid, err = validate_hard_mode(
        req.current_guess, req.prior_guesses, req.prior_evaluations
    )
    return HardModeValidateResponse(is_valid=is_valid, error_message=err)


@router.post("/entropy/hints", response_model=EntropyHintResponse)
def calculate_entropy_hints(req: EntropyHintRequest):
    """
    Computes Shannon Information Entropy and expected candidate shrinkage
    across remaining candidate words.
    """
    candidates = [w.lower() for w in req.candidate_words if len(w) == 5]
    if not candidates:
        return EntropyHintResponse(candidate_count=0, top_recommendations=[])

    recs = get_top_recommendations(
        candidates=candidates,
        top_k=req.top_k,
        allowed_words=ALL_WORDS_LIST,
    )

    recommendations = [
        EntropyRecommendation(
            word=r["word"],
            entropy_bits=r["entropy_bits"],
            expected_remaining=r["expected_remaining"],
            is_candidate=r["is_candidate"],
            win_probability=r["win_probability"],
        )
        for r in recs
    ]

    return EntropyHintResponse(
        candidate_count=len(candidates),
        top_recommendations=recommendations,
    )


@router.post("/absurdle/guess", response_model=AbsurdleStepResponse)
def absurdle_adversarial_step(req: AbsurdleGuessRequest):
    """
    Executes one turn of adversarial bucketing:
    Partitions words into 243 pattern buckets and adopts the largest bucket
    with deterministic minimax tie-breaker.
    """
    g = req.guess.strip().lower()
    is_valid, _ = validate_word_in_dictionary(g)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Word not in dictionary")

    candidates = (
        [w.lower() for w in req.candidate_words]
        if req.candidate_words
        else list(SOLUTIONS_LIST)
    )

    chosen_pattern, remaining_words, is_game_won = absurdle_turn(g, candidates)

    return AbsurdleStepResponse(
        guess=g.upper(),
        chosen_pattern=chosen_pattern,
        remaining_count=len(remaining_words),
        remaining_words=[w.upper() for w in remaining_words],
        is_game_won=is_game_won,
    )
