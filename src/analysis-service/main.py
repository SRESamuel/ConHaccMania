import json
import logging
from collections import Counter
from contextlib import asynccontextmanager
from uuid import UUID

import asyncpg
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from database import close_pool, get_pool, open_pool
from models import (
    AnalysisDetail,
    DashboardData,
    ValidateDto,
    ValidateResponse,
)
from services.claude_validator import ValidatorError, build_prompt, validate

log = logging.getLogger("analysis")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _decode_jsonb(value):
    """asyncpg sometimes returns JSONB as str — normalize to Python object."""
    if value is None:
        return None
    if isinstance(value, str):
        return json.loads(value)
    return value


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_pool()
    yield
    await close_pool()


app = FastAPI(
    title="NewGenLearning - Analysis Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Aggregation helper — Python-side merge of per-answer outputs into overall.
# Per architectural decision: deterministic, no second Claude pass.
# ---------------------------------------------------------------------------
def aggregate_overall(per_answer: list[dict]) -> dict:
    if not per_answer:
        return {"strengths": [], "areas_for_improvement": [], "recommended_topics": []}

    all_strengths: list[str] = []
    all_gaps: list[str] = []
    for r in per_answer:
        all_strengths.extend(r.get("strengths") or [])
        all_gaps.extend(r.get("gaps") or [])

    strengths = list(dict.fromkeys(all_strengths))
    areas_for_improvement = list(dict.fromkeys(all_gaps))

    if len(per_answer) > 1:
        gap_counts = Counter(all_gaps)
        recommended_topics = [g for g, c in gap_counts.most_common() if c >= 2]
    else:
        recommended_topics = areas_for_improvement[:3]

    return {
        "strengths": strengths,
        "areas_for_improvement": areas_for_improvement,
        "recommended_topics": recommended_topics,
    }


# ---------------------------------------------------------------------------
# Per-submission analysis pipeline.
# ---------------------------------------------------------------------------
async def analyze_submission(conn: asyncpg.Connection, submission_id: UUID) -> str:
    """Delete-and-replace analysis for one submission. Returns final status."""
    await conn.execute(
        "DELETE FROM analyses WHERE submission_id = $1", submission_id
    )
    analysis_id: UUID = await conn.fetchval(
        "INSERT INTO analyses (submission_id, status) VALUES ($1, 'pending') RETURNING id",
        submission_id,
    )

    answer_rows = await conn.fetch(
        """
        SELECT a.id AS answer_id, a.reasoning,
               q.id AS question_id, q.scenario, q.eval_criteria,
               sel.label AS selected_label
        FROM answers a
        JOIN questions q ON q.id = a.question_id
        JOIN solutions sel ON sel.id = a.selected_solution_id
        WHERE a.submission_id = $1
        ORDER BY a.id
        """,
        submission_id,
    )

    per_answer_results: list[dict] = []
    try:
        for row in answer_rows:
            solutions = await conn.fetch(
                """
                SELECT label, code, language, is_correct
                FROM solutions WHERE question_id = $1 ORDER BY label
                """,
                row["question_id"],
            )
            correct = next((s for s in solutions if s["is_correct"]), None)
            correct_label = correct["label"] if correct else "?"

            prompt = build_prompt(
                scenario=row["scenario"],
                solutions=[dict(s) for s in solutions],
                correct_label=correct_label,
                selected_label=row["selected_label"],
                reasoning=row["reasoning"],
                eval_criteria=row["eval_criteria"],
            )

            log.info("Validating answer %s (submission %s)", row["answer_id"], submission_id)
            result = validate(prompt)

            await conn.execute(
                """
                INSERT INTO answer_analyses
                  (analysis_id, answer_id, score, strengths, gaps, is_ai_generated, confidence)
                VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
                """,
                analysis_id,
                row["answer_id"],
                int(result.get("score", 0)),
                json.dumps(result.get("strengths", [])),
                json.dumps(result.get("gaps", [])),
                bool(result.get("is_ai_generated", False)),
                float(result.get("confidence", 0.0)),
            )
            per_answer_results.append(result)

    except (ValidatorError, KeyError, ValueError) as e:
        log.exception("Analysis failed for submission %s: %s", submission_id, e)
        await conn.execute(
            "UPDATE analyses SET status = 'failed' WHERE id = $1", analysis_id
        )
        return "failed"

    if not per_answer_results:
        await conn.execute(
            "UPDATE analyses SET status = 'completed', overall_score = NULL, "
            "overall = $1::jsonb WHERE id = $2",
            json.dumps(aggregate_overall([])),
            analysis_id,
        )
        return "completed"

    avg_score = sum(int(r.get("score", 0)) for r in per_answer_results) / len(per_answer_results)
    overall = aggregate_overall(per_answer_results)
    await conn.execute(
        """
        UPDATE analyses
        SET status = 'completed', overall_score = $1, overall = $2::jsonb
        WHERE id = $3
        """,
        avg_score,
        json.dumps(overall),
        analysis_id,
    )
    return "completed"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post(
    "/api/analysis/validate",
    response_model=ValidateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def validate_quiz(payload: ValidateDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        submissions = await conn.fetch(
            "SELECT id FROM submissions WHERE quiz_id = $1 ORDER BY submitted_at",
            payload.quiz_id,
        )
        analyzed = 0
        for sub in submissions:
            outcome = await analyze_submission(conn, sub["id"])
            if outcome == "completed":
                analyzed += 1
    return {"analyzed": analyzed}


# Note: /dashboard route declared BEFORE /{submission_id} so FastAPI matches
# "dashboard" as the literal path, not as a UUID path param.
@app.get("/api/analysis/dashboard", response_model=DashboardData)
async def dashboard(quiz_id: UUID | None = None):
    pool = get_pool()
    async with pool.acquire() as conn:
        if quiz_id is not None:
            total_submissions = await conn.fetchval(
                "SELECT count(*) FROM submissions WHERE quiz_id = $1", quiz_id
            )
            analyzed_count = await conn.fetchval(
                """
                SELECT count(*) FROM analyses a
                JOIN submissions s ON s.id = a.submission_id
                WHERE a.status = 'completed' AND s.quiz_id = $1
                """,
                quiz_id,
            )
            avg = await conn.fetchval(
                """
                SELECT avg(a.overall_score) FROM analyses a
                JOIN submissions s ON s.id = a.submission_id
                WHERE a.status = 'completed' AND s.quiz_id = $1
                """,
                quiz_id,
            )
            ai_flag_count = await conn.fetchval(
                """
                SELECT count(*) FROM answer_analyses aa
                JOIN analyses a ON a.id = aa.analysis_id
                JOIN submissions s ON s.id = a.submission_id
                WHERE aa.is_ai_generated = true AND s.quiz_id = $1
                """,
                quiz_id,
            )
            gap_rows = await conn.fetch(
                """
                SELECT aa.gaps FROM answer_analyses aa
                JOIN analyses a ON a.id = aa.analysis_id
                JOIN submissions s ON s.id = a.submission_id
                WHERE s.quiz_id = $1
                """,
                quiz_id,
            )
        else:
            total_submissions = await conn.fetchval("SELECT count(*) FROM submissions")
            analyzed_count = await conn.fetchval(
                "SELECT count(*) FROM analyses WHERE status = 'completed'"
            )
            avg = await conn.fetchval(
                "SELECT avg(overall_score) FROM analyses WHERE status = 'completed'"
            )
            ai_flag_count = await conn.fetchval(
                "SELECT count(*) FROM answer_analyses WHERE is_ai_generated = true"
            )
            gap_rows = await conn.fetch("SELECT gaps FROM answer_analyses")

    all_gaps: list[str] = []
    for row in gap_rows:
        gaps = _decode_jsonb(row["gaps"]) or []
        all_gaps.extend(gaps)
    common_gaps = [
        {"gap": g, "count": c} for g, c in Counter(all_gaps).most_common(5)
    ]

    return {
        "total_submissions": total_submissions or 0,
        "analyzed_count": analyzed_count or 0,
        "average_score": float(avg) if avg is not None else None,
        "common_gaps": common_gaps,
        "ai_flag_count": ai_flag_count or 0,
    }


@app.get("/api/analysis/{submission_id}", response_model=AnalysisDetail)
async def get_analysis(submission_id: UUID):
    pool = get_pool()
    async with pool.acquire() as conn:
        analysis = await conn.fetchrow(
            """
            SELECT id, submission_id, status, overall_score, overall
            FROM analyses
            WHERE submission_id = $1
            ORDER BY created_at DESC
            LIMIT 1
            """,
            submission_id,
        )
        if analysis is None:
            raise HTTPException(
                status_code=404,
                detail=f"No analysis for submission {submission_id}",
            )
        per_answer = await conn.fetch(
            """
            SELECT answer_id, score, strengths, gaps, is_ai_generated, confidence
            FROM answer_analyses
            WHERE analysis_id = $1
            ORDER BY answer_id
            """,
            analysis["id"],
        )

    return {
        "id": analysis["id"],
        "submission_id": analysis["submission_id"],
        "status": analysis["status"],
        "overall_score": float(analysis["overall_score"]) if analysis["overall_score"] is not None else None,
        "overall": _decode_jsonb(analysis["overall"]),
        "per_answer": [
            {
                "answer_id": r["answer_id"],
                "score": r["score"],
                "strengths": _decode_jsonb(r["strengths"]) or [],
                "gaps": _decode_jsonb(r["gaps"]) or [],
                "is_ai_generated": r["is_ai_generated"],
                "confidence": r["confidence"],
            }
            for r in per_answer
        ],
    }
