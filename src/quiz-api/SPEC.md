# Quiz API — Internal Specification

## Architecture

```
FastAPI (main.py)
├── routers/
│   ├── quizzes.py      — CRUD quizzes
│   ├── questions.py    — CRUD questions + generate wrong options
│   └── solutions.py    — Save accepted solutions
├── services/
│   └── gemini_generator.py  — Gemini API integration
├── models.py           — Pydantic models (DTOs)
└── database.py         — Neon connection
```

## Database Tables (owned)

| Table | Purpose |
|-------|---------|
| quizzes | Quiz metadata (title, course, instructor) |
| questions | Scenario + eval_criteria per question |
| solutions | Code options — correct and wrong, with labels |

> Full schema: see `docs/DATABASE.md`

## Key Logic

### Create Question Flow

1. Receive `CreateQuestionDto` with scenario + correct solution
2. INSERT into `questions` (scenario, eval_criteria)
3. INSERT into `solutions` (code, language, is_correct=true, label="A")

### Generate Wrong Options Flow

1. Receive `GenerateDto` with count (e.g., 3)
2. SELECT correct solution from DB (code, language)
3. SELECT question scenario from DB
4. Call Gemini API with scenario + correct solution
5. Return generated options to frontend (not saved yet)
6. Instructor reviews → accepts → POST `/api/questions/{id}/solutions`

### Gemini Prompt

```
Given this scenario:
{scenario}

And this correct solution:
{correct_code}

Generate {count} plausible but WRONG solutions.
For each, provide:
- code: the wrong implementation
- hint: a short label (e.g., "Off-by-one error")
- why_wrong: explanation of why this is incorrect

Return JSON array.
```

### Student View Filtering

When `GET /api/quizzes/{id}` is called, solutions are returned WITHOUT:
- `is_correct`
- `why_wrong`

These fields are instructor-only. Filtering happens at the application layer.

## Dependencies

```
fastapi
uvicorn[standard]
pydantic
google-generativeai    # Gemini API
asyncpg                # Neon PostgreSQL
```

## Port

`8001`
