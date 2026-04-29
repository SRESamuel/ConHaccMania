# Submission API — Internal Specification

## Architecture

```
FastAPI (main.py)
├── routers/
│   └── submissions.py  — Submit, list, get submissions
├── models.py           — Pydantic models (DTOs)
└── database.py         — Neon connection
```

## Database Tables (owned)

| Table | Purpose |
|-------|---------|
| submissions | Quiz submission metadata (student, quiz, timestamp) |
| answers | Per-question answer (selected solution + reasoning) |

> Full schema: see `docs/DATABASE.md`

## Key Logic

### Submit Flow

1. Receive `CreateSubmissionDto` with quiz_id, student_name, answers[]
2. INSERT into `submissions` (quiz_id, student_name)
3. For each answer: INSERT into `answers` (submission_id, question_id, selected_solution_id, reasoning)
4. Return 201 with submission_id

### List Submissions

- `GET /api/submissions` — all submissions
- `GET /api/submissions?student_name=Alex` — filtered by student
- Returns submission metadata (no answers)

### Get Submission Detail

- `GET /api/submissions/{id}` — single submission with all answers
- Joins answers table, includes selected_solution_id and reasoning

## Dependencies

```
fastapi
uvicorn[standard]
pydantic
asyncpg                # Neon PostgreSQL
```

## Port

`8002`
