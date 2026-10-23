"""
Wordle Infinite: Comprehensive Edge-Case & Boundary Test Suite
Targeting:
- Strict Two-Pass Duplicate Letter Resolution & Ternary Encoding
- Shannon Information Entropy Boundaries (|W| = 0, 1, 2, and Opener Bit Gains)
- Absurdle Adversarial Equivalence Partitioning & Minimax Tie-Breaking
- Hard Mode Positional & Frequency Constraint Enforcement
- Mulberry32 PRNG Cross-Platform Determinism & Multi-Grid Target Uniqueness
- REST API Robustness, Negative Scenarios & HTTP Error Boundaries
"""
import math
import pytest
from fastapi.testclient import TestClient

from app.config import (
    ALL_WORDS_LIST,
    MODE_MAX_GUESSES,
    MODE_TARGET_COUNTS,
    SOLUTIONS_LIST,
    SOLUTIONS_SET,
    VALID_WORDS_SET,
)
from app.core.absurdle_engine import absurdle_turn, information_cost
from app.core.entropy_solver import (
    compute_entropy_for_word,
    filter_candidates,
    get_top_recommendations,
)
from app.core.evaluator import (
    COLOR_MAP,
    REV_COLOR_MAP,
    decode_pattern,
    encode_pattern,
    evaluate_guess,
    evaluate_pattern_int,
)
from app.core.hard_mode import (
    validate_hard_mode,
    validate_word_in_dictionary,
)
from app.core.prng import (
    Mulberry32,
    get_daily_seed,
    get_daily_targets,
    get_today_str,
)
from app.main import app

client = TestClient(app)


# ==============================================================================
# 1. EVALUATOR & DUPLICATE LETTER RESOLUTION EDGE CASES
# ==============================================================================

class TestEvaluatorDuplicateLetters:
    """Exhaustive tests for Wordle two-pass duplicate letter resolution algorithm."""

    def test_one_in_target_duplicate_in_guess_crane_speed(self):
        """
        Target: CRANE (C:1, R:1, A:1, N:1, E:1) - exactly 1 E at index 4.
        Guess:  SPEED (S:0, P:1, E:2, E:3, D:4) - 2 E's at index 2 and 3.
        Pass 1 (Greens):
            No exact positional matches.
        Pass 2 (Yellows):
            Index 2 (first E): target has 1 E remaining -> YELLOW.
            Index 3 (second E): target count exhausted (0 left) -> MUST BE GRAY!
        Result: ['gray', 'gray', 'yellow', 'gray', 'gray']
        """
        result = evaluate_guess("SPEED", "CRANE")
        assert result == ["gray", "gray", "yellow", "gray", "gray"]
        assert result[2] == "yellow", "First 'E' in SPEED must be yellow"
        assert result[3] == "gray", "Second 'E' in SPEED MUST BE gray to avoid duplicate hallucination"

    def test_two_in_target_one_in_guess_geese_steak(self):
        """
        Target: GEESE (G:1, E:3, S:1) - 3 E's at index 1, 2, 4.
        Guess:  STEAK (S:0, T:1, E:2, A:3, K:4) - 1 E at index 2.
        Pass 1 (Greens):
            Index 2: E == E -> GREEN. Target remaining E's: 2.
        Pass 2 (Yellows):
            Index 0: S in GEESE -> YELLOW.
            Index 1: T not in GEESE -> GRAY.
            Index 3: A not in GEESE -> GRAY.
            Index 4: K not in GEESE -> GRAY.
        Result: ['yellow', 'gray', 'green', 'gray', 'gray']
        """
        result = evaluate_guess("STEAK", "GEESE")
        assert result == ["yellow", "gray", "green", "gray", "gray"]
        assert result[2] == "green"
        assert result.count("green") == 1
        assert result.count("yellow") == 1

    def test_complex_anagram_duplicates_abbey_babes(self):
        """
        Target: ABBEY (A:1, B:2, E:1, Y:1)
        Guess:  BABES (B:0, A:1, B:2, E:3, S:4)
        Pass 1 (Greens):
            Index 2: B == B -> GREEN. Target B left: 1.
            Index 3: E == E -> GREEN. Target E left: 0.
        Pass 2 (Yellows):
            Index 0: B -> Target has 1 B left -> YELLOW.
            Index 1: A -> Target has 1 A left -> YELLOW.
            Index 4: S -> Target has 0 S -> GRAY.
        Result: ['yellow', 'yellow', 'green', 'green', 'gray']
        """
        result = evaluate_guess("BABES", "ABBEY")
        assert result == ["yellow", "yellow", "green", "green", "gray"]
        # Integer pattern representation verification
        pat_int = evaluate_pattern_int("BABES", "ABBEY")
        assert decode_pattern(pat_int) == ["yellow", "yellow", "green", "green", "gray"]

    def test_three_in_guess_one_in_target_erase_error(self):
        """
        Target: ERASE (E:2, R:1, A:1, S:1) - exactly 1 R at index 1.
        Guess:  ERROR (E:0, R:1, R:2, O:3, R:4) - 3 R's at indices 1, 2, 4.
        Pass 1:
            Index 0: E == E -> GREEN. (Target E remaining: 1)
            Index 1: R == R -> GREEN. (Target R remaining: 0)
        Pass 2:
            Index 2: R -> target has 0 R left -> GRAY.
            Index 3: O -> target has 0 O -> GRAY.
            Index 4: R -> target has 0 R left -> GRAY.
        Result: ['green', 'green', 'gray', 'gray', 'gray']
        Both extra R's (indices 2 & 4) must be strictly GRAY.
        """
        result = evaluate_guess("ERROR", "ERASE")
        assert result == ["green", "green", "gray", "gray", "gray"]
        assert result[0] == "green"
        assert result[1] == "green"
        assert result[2] == "gray"
        assert result[3] == "gray"
        assert result[4] == "gray"

    def test_two_in_target_three_in_guess_terra_error(self):
        """
        Target: TERRA (T:1, E:1, R:2, A:1) - 2 R's at indices 2 and 3.
        Guess:  ERROR (E:0, R:1, R:2, O:3, R:4) - 3 R's at indices 1, 2, 4.
        Pass 1:
            Index 2: R == R -> GREEN. (Target R remaining: 1)
        Pass 2:
            Index 0: E in TERRA -> YELLOW.
            Index 1: R -> Target has 1 R remaining -> YELLOW.
            Index 3: O not in TERRA -> GRAY.
            Index 4: R -> Target has 0 R remaining -> GRAY.
        Result: ['yellow', 'yellow', 'green', 'gray', 'gray']
        """
        result = evaluate_guess("ERROR", "TERRA")
        assert result == ["yellow", "yellow", "green", "gray", "gray"]

    def test_target_banal_guess_annum(self):
        """
        Target: BANAL (B:1, A:2, N:1, L:1) - N at index 2.
        Guess:  ANNUM (A:0, N:1, N:2, U:3, M:4) - N at index 1 and 2.
        Pass 1:
            Index 2: N == N -> GREEN. (Target N remaining: 0)
        Pass 2:
            Index 0: A in BANAL -> YELLOW.
            Index 1: N -> Target has 0 N remaining -> GRAY.
            Index 3: U not in BANAL -> GRAY.
            Index 4: M not in BANAL -> GRAY.
        Result: ['yellow', 'gray', 'green', 'gray', 'gray']
        """
        result = evaluate_guess("ANNUM", "BANAL")
        assert result == ["yellow", "gray", "green", "gray", "gray"]
        assert result[0] == "yellow"
        assert result[1] == "gray"
        assert result[2] == "green"
        assert result[3] == "gray"
        assert result[4] == "gray"

    @pytest.mark.parametrize("guess,target,expected", [
        ("CraNe", "speed", ["gray", "gray", "gray", "gray", "yellow"]),
        ("CRANE", "SPEED", ["gray", "gray", "gray", "gray", "yellow"]),
        ("crane", "SPEED", ["gray", "gray", "gray", "gray", "yellow"]),
        ("cRaNe", "sPeEd", ["gray", "gray", "gray", "gray", "yellow"]),
        ("SpEeD", "cRaNe", ["gray", "gray", "yellow", "gray", "gray"]),
    ])
    def test_case_insensitivity_normalization(self, guess, target, expected):
        """Mixed, upper, and lowercase variations must evaluate identically."""
        assert evaluate_guess(guess, target) == expected

    @pytest.mark.parametrize("invalid_word", ["", "FOUR", "SIXLET", "A", "ABCDEFGH"])
    def test_non_5_letter_inputs_rejected(self, invalid_word):
        """Inputs differing from 5 characters must raise ValueError."""
        with pytest.raises(ValueError, match="Words must be 5 letters"):
            evaluate_guess(invalid_word, "CRANE")

        with pytest.raises(ValueError, match="Words must be 5 letters"):
            evaluate_guess("CRANE", invalid_word)

        with pytest.raises(ValueError, match="Words must be 5 letters"):
            evaluate_pattern_int(invalid_word, "CRANE")

    def test_pattern_encoder_decoder_boundaries(self):
        """Test base-3 pattern coding limits [0, 242] and invalid boundary triggers."""
        assert decode_pattern(0) == ["gray", "gray", "gray", "gray", "gray"]
        assert encode_pattern(["gray", "gray", "gray", "gray", "gray"]) == 0

        assert decode_pattern(242) == ["green", "green", "green", "green", "green"]
        assert encode_pattern(["green", "green", "green", "green", "green"]) == 242

        # Invalid pattern integers
        with pytest.raises(ValueError):
            decode_pattern(-1)
        with pytest.raises(ValueError):
            decode_pattern(243)
        with pytest.raises(ValueError):
            decode_pattern(999)

        # Invalid pattern list lengths
        with pytest.raises(ValueError):
            encode_pattern(["gray", "green"])
        with pytest.raises(ValueError):
            encode_pattern(["gray"] * 6)


# ==============================================================================
# 2. INFORMATION THEORY & SHANNON ENTROPY BOUNDARIES
# ==============================================================================

class TestInformationTheoryBoundaries:
    """Exhaustive boundary testing of Shannon entropy solver."""

    def test_single_candidate_strictly_zero_bits(self):
        """When exactly |W| = 1 candidate remains, H(g) must be strictly 0.0 bits."""
        ent, exp_rem, is_cand, win_prob = compute_entropy_for_word("crane", ["crane"])
        assert ent == 0.0
        assert exp_rem == 1.0
        assert is_cand is True
        assert win_prob == 1.0

        # Recommendation response for single candidate
        recs = get_top_recommendations(["crane"])
        assert len(recs) == 1
        assert recs[0]["word"] == "CRANE"
        assert recs[0]["entropy_bits"] == 0.0
        assert recs[0]["win_probability"] == 1.0

    def test_two_candidates_bounded_by_one_bit(self):
        """
        When |W| = 2 candidates remain, maximum entropy is log2(2) = 1.0 bit.
        Any guess must produce 0.0 <= H <= 1.0 bits.
        """
        candidates = ["cater", "water"]
        # Guess "cater" splits them into:
        # cater vs cater -> all greens (prob = 0.5)
        # cater vs water -> ['gray', 'green', 'green', 'green', 'green'] (prob = 0.5)
        # Entropy = - 2 * (0.5 * log2(0.5)) = 1.0 bit
        ent_cater, exp_rem, is_cand, win_prob = compute_entropy_for_word("cater", candidates)
        assert math.isclose(ent_cater, 1.0, rel_tol=1e-5)
        assert is_cand is True
        assert win_prob == 0.5

        # A non-distinguishing guess has 0.0 bits
        ent_fuzzy, _, _, _ = compute_entropy_for_word("fuzzy", candidates)
        # fuzzy vs cater and fuzzy vs water both give all gray -> 1 bucket of size 2 -> 0.0 bits
        assert math.isclose(ent_fuzzy, 0.0, abs_tol=1e-5)
        assert 0.0 <= ent_fuzzy <= 1.0

    def test_zero_candidates_safe_no_crash(self):
        """Empty candidate pool (|W| = 0) must handle gracefully without log2(0) or division by zero."""
        ent, exp_rem, is_cand, win_prob = compute_entropy_for_word("crane", [])
        assert ent == 0.0
        assert exp_rem == 0.0
        assert is_cand is False
        assert win_prob == 0.0

        recs = get_top_recommendations([])
        assert recs == []

    @pytest.mark.parametrize("opener", ["soare", "roate", "raise", "slate"])
    def test_top_openers_entropy_greater_than_5_8_bits(self, opener):
        """Top Wordle openers must achieve expected information gain > 5.8 bits against solutions pool."""
        ent, exp_rem, is_cand, win_prob = compute_entropy_for_word(opener, SOLUTIONS_LIST)
        assert ent > 5.80, f"Expected {opener.upper()} entropy > 5.8 bits, got {ent}"
        assert exp_rem < 80.0, f"Expected {opener.upper()} exp_rem < 80, got {exp_rem}"

    def test_filter_candidates_exact_pruning(self):
        """Candidate filtering prunes mathematically correctly."""
        pool = ["cater", "water", "hater", "later", "eater"]

        # Exact match pattern leaves only the matched word
        greens = ["green"] * 5
        assert filter_candidates("cater", greens, pool) == ["cater"]

        # Impossible pattern leaves empty list
        impossible_pat = ["green", "green", "green", "green", "yellow"]
        assert filter_candidates("cater", impossible_pat, pool) == []


# ==============================================================================
# 3. ABSURDLE ADVERSARIAL PARTITIONER EDGE CASES
# ==============================================================================

class TestAbsurdleAdversarialPartitioner:
    """Exhaustive testing of minimax equivalence partitioning in Absurdle."""

    def test_first_guess_obscure_leaves_greater_than_1000_words(self):
        """
        Turn 1: Guessing obscure low-frequency words forces the largest bucket
        with all grays, leaving > 1,000 words in the candidate pool.
        """
        # XYLYL: 1,334 words have no X, Y, or L
        pat_xylyl, rem_xylyl, won_xylyl = absurdle_turn("XYLYL", SOLUTIONS_LIST)
        assert not won_xylyl
        assert pat_xylyl == ["gray", "gray", "gray", "gray", "gray"]
        assert len(rem_xylyl) == 1334
        assert len(rem_xylyl) > 1000

        # FUZZY: 1,352 words have no F, U, Z, or Y
        pat_fuzzy, rem_fuzzy, won_fuzzy = absurdle_turn("FUZZY", SOLUTIONS_LIST)
        assert not won_fuzzy
        assert pat_fuzzy == ["gray", "gray", "gray", "gray", "gray"]
        assert len(rem_fuzzy) == 1352
        assert len(rem_fuzzy) > 1000

    def test_first_guess_high_frequency_word_partitions_adversarially(self):
        """
        Turn 1 with a high-vowel opener (e.g., ADIEU) must evade by selecting
        the largest bucket while strictly giving minimal information.
        """
        pat_adieu, rem_adieu, won = absurdle_turn("ADIEU", SOLUTIONS_LIST)
        assert not won
        # The largest bucket for ADIEU leaves 284 words with pattern ['yellow', 'gray', 'gray', 'gray', 'gray']
        assert len(rem_adieu) == 284
        assert pat_adieu == ["yellow", "gray", "gray", "gray", "gray"]

    def test_monotonic_candidate_pool_shrinkage(self):
        """
        Candidate pool size must be strictly monotonically non-increasing across turns:
        |W_{t+1}| <= |W_t|.
        """
        guesses = ["ROATE", "SLING", "PUMPY", "CHALK"]
        current_pool = list(SOLUTIONS_LIST)
        pool_sizes = [len(current_pool)]

        for g in guesses:
            _, current_pool, _ = absurdle_turn(g, current_pool)
            pool_sizes.append(len(current_pool))

        # Check monotonic non-increasing property
        for i in range(len(pool_sizes) - 1):
            assert pool_sizes[i + 1] <= pool_sizes[i], (
                f"Candidate pool expanded from {pool_sizes[i]} to {pool_sizes[i+1]}"
            )
            assert pool_sizes[i + 1] > 0

    def test_terminal_collapse_and_victory(self):
        """When pool collapses to 1 word and user guesses that word, Absurdle yields 5 greens."""
        pat, rem, is_won = absurdle_turn("SLOTH", ["sloth"])
        assert is_won is True
        assert pat == ["green", "green", "green", "green", "green"]
        assert rem == ["sloth"]

    def test_terminal_pool_wrong_guess(self):
        """When pool has 1 word and user guesses wrong word, game is NOT won."""
        pat, rem, is_won = absurdle_turn("CRANE", ["sloth"])
        assert is_won is False
        assert pat == ["gray", "gray", "gray", "gray", "gray"]
        assert rem == ["sloth"]

    def test_repeated_guess_same_word_deterministic_no_hang(self):
        """Guessing the same word consecutively must execute deterministically without infinite loop."""
        turn1_pat, turn1_rem, _ = absurdle_turn("ROATE", SOLUTIONS_LIST)
        turn2_pat, turn2_rem, _ = absurdle_turn("ROATE", turn1_rem)

        # Same guess on already partitioned pool gives identical pattern and pool
        assert turn2_pat == turn1_pat
        assert turn2_rem == turn1_rem
        assert len(turn2_rem) == len(turn1_rem)

    def test_empty_candidate_pool_safe(self):
        """Absurdle with empty candidates handles gracefully."""
        pat, rem, is_won = absurdle_turn("CRANE", [])
        assert pat == ["gray"] * 5
        assert rem == []
        assert is_won is False


# ==============================================================================
# 4. HARD MODE VALIDATION BOUNDARIES
# ==============================================================================

class TestHardModeValidation:
    """Exhaustive tests for Wordle Hard Mode constraint enforcement."""

    def test_green_positional_constraint_violation(self):
        """If slot k was revealed green in a prior turn, subsequent guesses must preserve it."""
        # Prior turn: CRANE revealed R at index 1 (slot 2) as GREEN
        prior_guesses = ["CRANE"]
        prior_evals = [["gray", "green", "gray", "gray", "gray"]]

        # CLERK has 'L' at slot 2 -> Violation
        valid, err = validate_hard_mode("CLERK", prior_guesses, prior_evals)
        assert valid is False
        assert err == "Position 2 must be 'R'"

        # CRAWL has 'R' at slot 2 -> Valid
        valid, err = validate_hard_mode("CRAWL", prior_guesses, prior_evals)
        assert valid is True
        assert err is None

    def test_yellow_inclusion_constraint_violation(self):
        """If a letter was revealed yellow, subsequent guesses must contain it."""
        # Prior turn: CRANE revealed A at index 2 (slot 3) as YELLOW
        prior_guesses = ["CRANE"]
        prior_evals = [["gray", "gray", "yellow", "gray", "gray"]]

        # GHOST has no 'A' -> Violation
        valid, err = validate_hard_mode("GHOST", prior_guesses, prior_evals)
        assert valid is False
        assert err == "Guess must contain 'A'"

        # STEAM has 'A' -> Valid
        valid, err = validate_hard_mode("STEAM", prior_guesses, prior_evals)
        assert valid is True
        assert err is None

    def test_multiple_yellow_letters_omission(self):
        """When multiple yellows were revealed, omitting even one is a violation."""
        # Prior turn: STARE revealed S and E as YELLOW
        prior_guesses = ["STARE"]
        prior_evals = [["yellow", "gray", "gray", "gray", "yellow"]]

        # Guess with only 'S' (no 'E')
        valid, err = validate_hard_mode("SOLID", prior_guesses, prior_evals)
        assert valid is False
        assert err == "Guess must contain 'E'"

        # Guess with only 'E' (no 'S')
        valid, err = validate_hard_mode("ELBOW", prior_guesses, prior_evals)
        assert valid is False
        assert err == "Guess must contain 'S'"

        # Guess with both 'S' and 'E'
        valid, err = validate_hard_mode("SHINE", prior_guesses, prior_evals)
        assert valid is True
        assert err is None

    def test_cumulative_prior_turns_constraints(self):
        """Hard mode must enforce constraints cumulatively across all previous turns."""
        prior_guesses = ["CRANE", "PILOT"]
        prior_evals = [
            ["green", "gray", "gray", "gray", "gray"],  # Pos 1 is 'C'
            ["gray", "gray", "gray", "yellow", "gray"],  # Must contain 'O'
        ]

        # Missing 'C' at pos 1
        v1, err1 = validate_hard_mode("SHOCK", prior_guesses, prior_evals)
        assert v1 is False
        assert err1 == "Position 1 must be 'C'"

        # Has 'C' at pos 1, but missing 'O'
        v2, err2 = validate_hard_mode("CLERK", prior_guesses, prior_evals)
        assert v2 is False
        assert err2 == "Guess must contain 'O'"

        # Satisfies both
        v3, err3 = validate_hard_mode("CHORD", prior_guesses, prior_evals)
        assert v3 is True
        assert err3 is None

    def test_dictionary_membership_validation(self):
        """Validates dictionary membership against the 14,855 master dictionary."""
        # 5-letter solution
        assert validate_word_in_dictionary("crane") == (True, None)
        assert validate_word_in_dictionary("CRANE") == (True, None)

        # 5-letter valid guess
        assert validate_word_in_dictionary("aahed") == (True, None)

        # Non-dictionary word
        is_val, err = validate_word_in_dictionary("xyzzy")
        assert is_val is False
        assert err == "Not in word list"

        # Wrong length or non-alpha
        is_val, err = validate_word_in_dictionary("four")
        assert is_val is False
        assert err == "Word must be 5 letters"

        is_val, err = validate_word_in_dictionary("12345")
        assert is_val is False
        assert err == "Word must be 5 letters"


# ==============================================================================
# 5. MULBERRY32 PRNG & MULTI-GRID TARGET UNIQUENESS
# ==============================================================================

class TestMulberry32PRNGAndMultiGrid:
    """Exhaustive tests for Mulberry32 PRNG and target word set uniqueness."""

    @pytest.mark.parametrize("mode,expected_count", [
        ("classic", 1),
        ("dordle", 2),
        ("quordle", 4),
        ("octordle", 8),
        ("absurdle", 1),
    ])
    def test_multi_grid_target_counts(self, mode, expected_count):
        """Verifies each mode receives the exact prescribed target count."""
        targets = get_daily_targets("2026-10-23", mode)
        assert len(targets) == expected_count

    def test_multi_grid_target_strictly_unique_within_match(self):
        """
        Dordle (2 words), Quordle (4 words), and Octordle (8 words) must NEVER
        assign duplicate target words within the same match across 50 test dates.
        """
        test_dates = [
            f"2026-{month:02d}-{day:02d}"
            for month in range(1, 13)
            for day in [1, 10, 20, 28]
        ]

        for date_str in test_dates:
            # Dordle (2 words)
            dordle_targets = get_daily_targets(date_str, "dordle")
            assert len(dordle_targets) == 2
            assert len(set(dordle_targets)) == 2, f"Dordle duplicate detected on {date_str}: {dordle_targets}"

            # Quordle (4 words)
            quordle_targets = get_daily_targets(date_str, "quordle")
            assert len(quordle_targets) == 4
            assert len(set(quordle_targets)) == 4, f"Quordle duplicate detected on {date_str}: {quordle_targets}"

            # Octordle (8 words)
            octordle_targets = get_daily_targets(date_str, "octordle")
            assert len(octordle_targets) == 8
            assert len(set(octordle_targets)) == 8, f"Octordle duplicate detected on {date_str}: {octordle_targets}"

    def test_daily_reproducibility(self):
        """Identical date and mode yield bit-for-bit identical word lists across 10 calls."""
        date_str = "2026-10-23"
        baseline_quordle = get_daily_targets(date_str, "quordle")
        for _ in range(10):
            repeated = get_daily_targets(date_str, "quordle")
            assert repeated == baseline_quordle

    @pytest.mark.parametrize("date_str", [
        "2026-10-23",
        "2026-01-01",
        "2025-12-31",
        "1999-12-31",
        "2030-07-04",
    ])
    def test_date_format_variations(self, date_str):
        """Date variations produce non-crashing 32-bit seeds and valid words."""
        seed = get_daily_seed(date_str, "classic")
        assert 0 <= seed <= 0xFFFFFFFF

        targets = get_daily_targets(date_str, "classic")
        assert len(targets) == 1
        assert targets[0] in SOLUTIONS_SET

    def test_different_modes_distinct_seeds_and_targets(self):
        """On the same date, classic, dordle, quordle, and octordle have different seeds."""
        date_str = "2026-10-23"
        s_classic = get_daily_seed(date_str, "classic")
        s_dordle = get_daily_seed(date_str, "dordle")
        s_quordle = get_daily_seed(date_str, "quordle")
        s_octordle = get_daily_seed(date_str, "octordle")

        seeds = {s_classic, s_dordle, s_quordle, s_octordle}
        assert len(seeds) == 4, "Seeds between modes must be distinct"


# ==============================================================================
# 6. API ENDPOINTS ROBUSTNESS & NEGATIVE SCENARIOS
# ==============================================================================

class TestAPIEndpointsRobustness:
    """Integration and negative boundary tests for FastAPI REST routes."""

    def test_get_health(self):
        """GET /api/v1/health returns 200 with dictionary metrics."""
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "healthy"
        assert body["solutions_count"] == 2315
        assert body["valid_guesses_count"] == 12540
        assert body["total_words"] == 14855

    def test_get_daily_invalid_mode_rejected(self):
        """GET /api/v1/game/daily?mode=superwordle must return HTTP 400."""
        res = client.get("/api/v1/game/daily?mode=superwordle")
        assert res.status_code == 400
        assert "Invalid game mode" in res.json()["detail"]

        res2 = client.get("/api/v1/game/daily?mode=megawordle")
        assert res2.status_code == 400

    def test_get_daily_valid_modes(self):
        """GET /api/v1/game/daily with valid modes returns proper structures."""
        for mode, count in [("classic", 1), ("dordle", 2), ("quordle", 4), ("octordle", 8)]:
            res = client.get(f"/api/v1/game/daily?mode={mode}&date=2026-10-23")
            assert res.status_code == 200
            data = res.json()
            assert data["mode"] == mode
            assert len(data["targets"]) == count
            assert len(set(data["targets"])) == count

    def test_post_words_validate_boundaries(self):
        """POST /api/v1/words/validate boundary and malformed checks."""
        # Valid solution
        r1 = client.post("/api/v1/words/validate", json={"word": "CRANE"})
        assert r1.status_code == 200
        assert r1.json()["is_valid"] is True

        # Valid guess-only
        r2 = client.post("/api/v1/words/validate", json={"word": "AAHED"})
        assert r2.status_code == 200
        assert r2.json()["is_valid"] is True

        # Invalid 5-letter word
        r3 = client.post("/api/v1/words/validate", json={"word": "XYZZY"})
        assert r3.status_code == 200
        assert r3.json()["is_valid"] is False
        assert r3.json()["error_message"] == "Not in word list"

        # Too short (4 letters) -> 422 Unprocessable Entity
        r4 = client.post("/api/v1/words/validate", json={"word": "FOUR"})
        assert r4.status_code == 422

        # Too long (6 letters) -> 422 Unprocessable Entity
        r5 = client.post("/api/v1/words/validate", json={"word": "SIXLET"})
        assert r5.status_code == 422

    def test_post_entropy_hints_empty_and_single(self):
        """POST /api/v1/entropy/hints with empty candidate list and 1 candidate."""
        # Empty candidate list
        r_empty = client.post("/api/v1/entropy/hints", json={"candidate_words": []})
        assert r_empty.status_code == 200
        data_empty = r_empty.json()
        assert data_empty["candidate_count"] == 0
        assert data_empty["top_recommendations"] == []

        # Single candidate
        r_single = client.post("/api/v1/entropy/hints", json={"candidate_words": ["CRANE"]})
        assert r_single.status_code == 200
        data_single = r_single.json()
        assert data_single["candidate_count"] == 1
        assert len(data_single["top_recommendations"]) == 1
        assert data_single["top_recommendations"][0]["word"] == "CRANE"
        assert data_single["top_recommendations"][0]["entropy_bits"] == 0.0

    def test_post_absurdle_guess_invalid_word(self):
        """POST /api/v1/absurdle/guess with invalid word must return HTTP 400."""
        # Non-dictionary word
        r_inv = client.post("/api/v1/absurdle/guess", json={"guess": "XYZZY"})
        assert r_inv.status_code == 400
        assert r_inv.json()["detail"] == "Word not in dictionary"

        # Malformed word length
        r_short = client.post("/api/v1/absurdle/guess", json={"guess": "TINY"})
        assert r_short.status_code == 422

    def test_post_evaluate_multi_grid_and_invalid_guess(self):
        """POST /api/v1/game/evaluate handles multi-target boards and invalid guess words."""
        # Multi-grid evaluate (Quordle 4 targets)
        req = {
            "guess": "CRANE",
            "targets": ["CRANE", "SLATE", "SPEED", "GHOST"],
        }
        res = client.post("/api/v1/game/evaluate", json=req)
        assert res.status_code == 200
        data = res.json()
        assert data["guess"] == "CRANE"
        assert len(data["evaluations"]) == 4
        # Board 0 is exact match
        assert data["evaluations"][0]["is_solved"] is True
        assert data["evaluations"][0]["pattern"] == ["green"] * 5
        # Board 1 is not solved
        assert data["evaluations"][1]["is_solved"] is False

        # Invalid guess word not in dictionary -> 400
        res_bad = client.post("/api/v1/game/evaluate", json={"guess": "XYZZY", "targets": ["CRANE"]})
        assert res_bad.status_code == 400
        assert res_bad.json()["detail"] == "Word not in dictionary"
