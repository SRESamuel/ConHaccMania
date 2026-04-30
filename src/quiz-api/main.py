import logging
from contextlib import asynccontextmanager
from typing import Literal
from uuid import UUID

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from database import close_pool, get_pool, open_pool
from models import (
    CreateQuestionDto,
    CreateQuizDto,
    CreateSolutionDto,
    GenerateDto,
    GeneratedOption,
    Question,
    Quiz,
    QuizDetail,
    QuizDetailStudentView,
    Solution,
    UpdateQuestionDto,
)
from services.gemini_generator import GeneratorError, generate as gemini_generate

log = logging.getLogger("quiz")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_pool()
    yield
    await close_pool()


app = FastAPI(
    title="NewGenLearning - Quiz API",
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
# Helpers
# ---------------------------------------------------------------------------
def _next_label(existing_labels: list[str]) -> str:
    """Given existing solution labels, return the next letter (A -> B -> C ...)."""
    if not existing_labels:
        return "A"
    max_label = max(existing_labels)
    return chr(ord(max_label) + 1)


# ---------------------------------------------------------------------------
# Reads (already implemented previously)
# ---------------------------------------------------------------------------
@app.get("/api/quizzes", response_model=list[Quiz])
async def list_quizzes():
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title, course, created_by, created_at "
            "FROM quizzes ORDER BY created_at DESC"
        )
    return [dict(r) for r in rows]


@app.get(
    "/api/quizzes/{quiz_id}",
    response_model=QuizDetail | QuizDetailStudentView,
)
async def get_quiz(
    quiz_id: UUID,
    role: Literal["student", "instructor"] = Query("instructor"),
):
    pool = get_pool()
    async with pool.acquire() as conn:
        quiz = await conn.fetchrow(
            "SELECT id, title, course, created_by FROM quizzes WHERE id = $1",
            quiz_id,
        )
        if quiz is None:
            raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found")

        questions = await conn.fetch(
            "SELECT id, quiz_id, scenario, eval_criteria FROM questions "
            "WHERE quiz_id = $1 ORDER BY created_at",
            quiz_id,
        )
        question_ids = [q["id"] for q in questions]

        solutions = await conn.fetch(
            "SELECT id, question_id, label, code, language, hint, is_correct, why_wrong "
            "FROM solutions WHERE question_id = ANY($1::uuid[]) ORDER BY label",
            question_ids,
        )

    solutions_by_question: dict[UUID, list[dict]] = {}
    for s in solutions:
        solutions_by_question.setdefault(s["question_id"], []).append(dict(s))

    result_questions = []
    for q in questions:
        q_solutions = solutions_by_question.get(q["id"], [])
        if role == "student":
            stripped = [
                {k: v for k, v in s.items() if k not in ("is_correct", "why_wrong", "question_id")}
                for s in q_solutions
            ]
            result_questions.append({
                "id": q["id"],
                "quiz_id": q["quiz_id"],
                "scenario": q["scenario"],
                "eval_criteria": q["eval_criteria"],
                "solutions": stripped,
            })
        else:
            full = [{k: v for k, v in s.items() if k != "question_id"} for s in q_solutions]
            result_questions.append({
                "id": q["id"],
                "quiz_id": q["quiz_id"],
                "scenario": q["scenario"],
                "eval_criteria": q["eval_criteria"],
                "solutions": full,
            })

    return {
        "id": quiz["id"],
        "title": quiz["title"],
        "course": quiz["course"],
        "created_by": quiz["created_by"],
        "questions": result_questions,
    }


# ---------------------------------------------------------------------------
# Writes
# ---------------------------------------------------------------------------
@app.post(
    "/api/quizzes",
    response_model=Quiz,
    status_code=status.HTTP_201_CREATED,
)
async def create_quiz(payload: CreateQuizDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO quizzes (title, course, created_by) VALUES ($1, $2, $3) "
            "RETURNING id, title, course, created_by, created_at",
            payload.title,
            payload.course,
            payload.created_by,
        )
    return dict(row)


@app.post(
    "/api/quizzes/{quiz_id}/questions",
    response_model=Question,
    status_code=status.HTTP_201_CREATED,
)
async def add_question(quiz_id: UUID, payload: CreateQuestionDto):
    """Create a question and its correct solution (auto-assigned label A) atomically."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            quiz_exists = await conn.fetchval(
                "SELECT 1 FROM quizzes WHERE id = $1", quiz_id
            )
            if not quiz_exists:
                raise HTTPException(
                    status_code=404, detail=f"Quiz {quiz_id} not found"
                )

            question_id = await conn.fetchval(
                "INSERT INTO questions (quiz_id, scenario, eval_criteria) "
                "VALUES ($1, $2, $3) RETURNING id",
                quiz_id,
                payload.scenario,
                payload.eval_criteria,
            )
            solution_id = await conn.fetchval(
                "INSERT INTO solutions "
                "  (question_id, label, code, language, hint, is_correct, why_wrong) "
                "VALUES ($1, 'A', $2, $3, $4, true, NULL) RETURNING id",
                question_id,
                payload.correct_solution.code,
                payload.correct_solution.language,
                payload.correct_solution.hint,
            )

    return {
        "id": question_id,
        "quiz_id": quiz_id,
        "scenario": payload.scenario,
        "eval_criteria": payload.eval_criteria,
        "solutions": [
            {
                "id": solution_id,
                "label": "A",
                "code": payload.correct_solution.code,
                "language": payload.correct_solution.language,
                "hint": payload.correct_solution.hint,
                "is_correct": True,
                "why_wrong": None,
            }
        ],
    }


@app.put("/api/questions/{question_id}", response_model=dict)
async def update_question(question_id: UUID, payload: UpdateQuestionDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE questions SET scenario = $1, eval_criteria = $2 "
            "WHERE id = $3 RETURNING id, quiz_id, scenario, eval_criteria",
            payload.scenario,
            payload.eval_criteria,
            question_id,
        )
        if row is None:
            raise HTTPException(
                status_code=404, detail=f"Question {question_id} not found"
            )
    return dict(row)


@app.post(
    "/api/questions/{question_id}/solutions",
    response_model=Solution,
    status_code=status.HTTP_201_CREATED,
)
async def add_solution(question_id: UUID, payload: CreateSolutionDto):
    """Save an accepted (wrong) distractor with auto-assigned next label."""
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            question_exists = await conn.fetchval(
                "SELECT 1 FROM questions WHERE id = $1", question_id
            )
            if not question_exists:
                raise HTTPException(
                    status_code=404, detail=f"Question {question_id} not found"
                )

            existing = await conn.fetch(
                "SELECT label FROM solutions WHERE question_id = $1", question_id
            )
            label = _next_label([r["label"] for r in existing])

            row = await conn.fetchrow(
                "INSERT INTO solutions "
                "  (question_id, label, code, language, hint, is_correct, why_wrong) "
                "VALUES ($1, $2, $3, $4, $5, false, $6) "
                "RETURNING id, label, code, language, hint, is_correct, why_wrong",
                question_id,
                label,
                payload.code,
                payload.language,
                payload.hint,
                payload.why_wrong,
            )
    return dict(row)


@app.post(
    "/api/questions/{question_id}/generate-wrong-options",
    response_model=list[GeneratedOption],
)
async def generate_wrong_options(question_id: UUID, payload: GenerateDto):
    """Ask Gemini for `count` plausible wrong solutions for this question.

    Returns generated options for instructor review. NOT persisted —
    instructor accepts via POST /api/questions/{id}/solutions.
    """
    if payload.count < 1 or payload.count > 5:
        raise HTTPException(
            status_code=400, detail="count must be between 1 and 5"
        )

    pool = get_pool()
    async with pool.acquire() as conn:
        question = await conn.fetchrow(
            "SELECT scenario FROM questions WHERE id = $1", question_id
        )
        if question is None:
            raise HTTPException(
                status_code=404, detail=f"Question {question_id} not found"
            )
        correct = await conn.fetchrow(
            "SELECT code, language FROM solutions "
            "WHERE question_id = $1 AND is_correct = true LIMIT 1",
            question_id,
        )
        if correct is None:
            raise HTTPException(
                status_code=400,
                detail=f"Question {question_id} has no correct solution to base distractors on",
            )

    log.info("Generating %d wrong options for question %s", payload.count, question_id)
    try:
        options = gemini_generate(
            scenario=question["scenario"],
            correct_code=correct["code"],
            language=correct["language"],
            count=payload.count,
        )
    except GeneratorError as e:
        log.exception("Gemini generation failed: %s", e)
        raise HTTPException(status_code=502, detail=f"Gemini error: {e}")

    return options
