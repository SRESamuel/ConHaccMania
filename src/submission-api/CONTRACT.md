# Submission API — Service Contract

## Provided — To Frontend (React)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| POST | `/api/submissions` | Submit quiz answers + reasoning | `CreateSubmissionDto` | 201 |
| GET | `/api/submissions` | List submissions (`?student_name=X` or `?quiz_id=X`) | - | `Submission[]` 200 |
| GET | `/api/submissions/{id}` | Get single submission with answers | - | `SubmissionDetail` 200 / 404 |

## Provided — To Other Services

None via API. Analysis Service reads submissions/answers tables directly from shared DB (read-only).

## Consumed — From Other Services

None.

## Consumed — From External

| Provider | Purpose |
|----------|---------|
| Neon (PostgreSQL) | Read/write submissions, answers |

## DTOs

```
Submission { id, quiz_id, student_name, submitted_at }
SubmissionDetail { id, quiz_id, student_name, submitted_at, answers[] }
Answer { id, question_id, selected_solution_id, reasoning }

CreateSubmissionDto {
  quiz_id,
  student_name,
  answers: [
    { question_id, selected_solution_id, reasoning }
  ]
}
```

## Error Responses

| Status | When |
|--------|------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 400 | Invalid input (missing fields, bad quiz_id) |
| 404 | Submission not found |
