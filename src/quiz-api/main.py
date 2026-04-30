from contextlib import asynccontextmanager
from typing import Literal
from uuid import UUID

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from database import close_pool, get_pool, open_pool
from models import (
    CreateQuestionDto,
    CreateQuizDto,
    CreateSolutionDto,
    GenerateDto,
    Quiz,
    QuizDetail,
    QuizDetailStudentView,
)
from gemini_generator import generate_wrong_options as gemini_generate


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


@app.post("/api/quizzes", response_model=Quiz, status_code=201)
async def create_quiz(dto: CreateQuizDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO quizzes (title, course, created_by) "
            "VALUES ($1, $2, $3) RETURNING id, title, course, created_by, created_at",
            dto.title, dto.course, dto.created_by,
        )
    return dict(row)


@app.post("/api/quizzes/{quiz_id}/questions", status_code=201)
async def add_question(quiz_id: UUID, dto: CreateQuestionDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        quiz = await conn.fetchrow("SELECT id FROM quizzes WHERE id = $1", quiz_id)
        if quiz is None:
            raise HTTPException(status_code=404, detail=f"Quiz {quiz_id} not found")

        question = await conn.fetchrow(
            "INSERT INTO questions (quiz_id, scenario, eval_criteria) "
            "VALUES ($1, $2, $3) RETURNING id",
            quiz_id, dto.scenario, dto.eval_criteria,
        )
        question_id = question["id"]

        await conn.execute(
            "INSERT INTO solutions (question_id, label, code, language, hint, is_correct) "
            "VALUES ($1, 'A', $2, $3, $4, true)",
            question_id, dto.correct_solution.code,
            dto.correct_solution.language, dto.correct_solution.hint,
        )

    return {"question_id": question_id}


@app.put("/api/questions/{question_id}")
async def update_question(question_id: UUID):
    raise HTTPException(status_code=501, detail="Not implemented")


@app.post("/api/questions/{question_id}/generate-wrong-options")
async def generate_wrong_options_endpoint(question_id: UUID, dto: GenerateDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        question = await conn.fetchrow(
            "SELECT scenario FROM questions WHERE id = $1", question_id
        )
        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        correct = await conn.fetchrow(
            "SELECT code, language FROM solutions WHERE question_id = $1 AND is_correct = true",
            question_id,
        )
        if correct is None:
            raise HTTPException(status_code=400, detail="No correct solution found")

    options = await gemini_generate(
        scenario=question["scenario"],
        correct_code=correct["code"],
        language=correct["language"],
        count=dto.count,
    )
    return {"generated_options": options}


@app.post("/api/questions/{question_id}/solutions", status_code=201)
async def add_solution(question_id: UUID, dto: CreateSolutionDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        # Get next label
        existing = await conn.fetch(
            "SELECT label FROM solutions WHERE question_id = $1 ORDER BY label DESC LIMIT 1",
            question_id,
        )
        next_label = chr(ord(existing[0]["label"]) + 1) if existing else "A"

        await conn.execute(
            "INSERT INTO solutions (question_id, label, code, language, hint, is_correct, why_wrong) "
            "VALUES ($1, $2, $3, $4, $5, false, $6)",
            question_id, next_label, dto.code, dto.language, dto.hint, dto.why_wrong,
        )
    return {"label": next_label}
