from contextlib import asynccontextmanager
from uuid import UUID

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from database import close_pool, get_pool, open_pool
from models import (
    CreateSubmissionDto,
    Submission,
    SubmissionDetail,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_pool()
    yield
    await close_pool()


app = FastAPI(
    title="NewGenLearning - Submission API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post(
    "/api/submissions",
    response_model=Submission,
    status_code=status.HTTP_201_CREATED,
)
async def submit_answers(payload: CreateSubmissionDto):
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            submission_id = await conn.fetchval(
                "INSERT INTO submissions (quiz_id, student_name) VALUES ($1, $2) RETURNING id",
                payload.quiz_id,
                payload.student_name,
            )
            await conn.executemany(
                "INSERT INTO answers (submission_id, question_id, selected_solution_id, reasoning) "
                "VALUES ($1, $2, $3, $4)",
                [
                    (submission_id, a.question_id, a.selected_solution_id, a.reasoning)
                    for a in payload.answers
                ],
            )
            row = await conn.fetchrow(
                "SELECT id, quiz_id, student_name, submitted_at FROM submissions WHERE id = $1",
                submission_id,
            )
    return dict(row)


@app.get("/api/submissions", response_model=list[Submission])
async def list_submissions(
    student_name: str | None = None,
    quiz_id: UUID | None = None,
):
    conditions: list[str] = []
    params: list = []
    if student_name is not None:
        params.append(student_name)
        conditions.append(f"student_name = ${len(params)}")
    if quiz_id is not None:
        params.append(quiz_id)
        conditions.append(f"quiz_id = ${len(params)}")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = (
        "SELECT id, quiz_id, student_name, submitted_at "
        f"FROM submissions {where} ORDER BY submitted_at DESC"
    )

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *params)
    return [dict(r) for r in rows]


@app.get("/api/submissions/{submission_id}", response_model=SubmissionDetail)
async def get_submission(submission_id: UUID):
    pool = get_pool()
    async with pool.acquire() as conn:
        sub = await conn.fetchrow(
            "SELECT id, quiz_id, student_name, submitted_at "
            "FROM submissions WHERE id = $1",
            submission_id,
        )
        if sub is None:
            raise HTTPException(
                status_code=404, detail=f"Submission {submission_id} not found"
            )
        answers = await conn.fetch(
            "SELECT id, question_id, selected_solution_id, reasoning "
            "FROM answers WHERE submission_id = $1 ORDER BY id",
            submission_id,
        )
    return {**dict(sub), "answers": [dict(a) for a in answers]}
