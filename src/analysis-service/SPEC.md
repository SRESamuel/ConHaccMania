# Analysis Service — Internal Specification

## Architecture

```
FastAPI (main.py)
├── routers/
│   ├── validate.py     — Trigger quiz-wide validation
│   └── dashboard.py    — Analysis results + class overview
├── services/
│   └── claude_validator.py  — Claude CLI subprocess
├── prompts/
│   └── validation_prompt.txt — Template for Claude
├── models.py           — Pydantic models (DTOs)
└── database.py         — Neon connection
```

## Database Tables (owned)

| Table | Purpose |
|-------|---------|
| analyses | Per-submission analysis (status, overall_score, overall JSONB) |
| answer_analyses | Per-answer score, strengths, gaps, AI-detection |

> Full schema: see `docs/DATABASE.md`

## Key Logic

### Validate Flow (POST /api/analysis/validate)

1. Receive `{ quiz_id }`
2. SELECT all submissions + answers from DB WHERE quiz_id
3. SELECT quiz questions + solutions from DB WHERE quiz_id
4. For each submission:
   a. Delete existing analysis if re-analyzing
   b. INSERT into `analyses` (submission_id, status='pending')
   c. For each answer:
      - Build Claude prompt (scenario + solutions + reasoning + eval_criteria)
      - Call Claude CLI via subprocess
      - Parse JSON response
      - INSERT into `answer_analyses`
   d. Calculate overall_score = avg(answer scores)
   e. Aggregate strengths, gaps, recommended topics into overall JSONB
   f. UPDATE `analyses` SET status='completed', overall_score, overall
5. Return 201 { analyzed: N submissions }

### Claude CLI Subprocess

```python
import subprocess
import json

def validate(prompt: str) -> dict:
    result = subprocess.run(
        ["claude", "-p", prompt, "--output-format", "json"],
        capture_output=True, text=True, timeout=120
    )
    return json.loads(result.stdout)
```

- Uses Claude subscription (not API) — no cost
- Timeout: 120 seconds per answer
- If subprocess fails → analysis status = 'failed'

### Claude Prompt Template

```
You are evaluating a student's reasoning about code.

SCENARIO:
{scenario}

SOLUTIONS:
A: {solution_a_code}
B: {solution_b_code}
C: {solution_c_code}

The correct answer is: {correct_label}
Student selected: {selected_label}
Student's reasoning: "{reasoning}"

Instructor's evaluation criteria: "{eval_criteria}"

Evaluate the student's reasoning. Return JSON:
{
  "score": 0-100,
  "strengths": ["..."],
  "gaps": ["..."],
  "is_ai_generated": true/false,
  "confidence": 0.0-1.0
}
```

### Dashboard Aggregation

- `GET /api/analysis/dashboard` reads all completed analyses
- Aggregates: avg score, total submissions, common gaps, AI flag count

## Dependencies

```
fastapi
uvicorn[standard]
pydantic
asyncpg                # Neon PostgreSQL (shared DB, read-only on other service tables)
```

## Port

`8003`
