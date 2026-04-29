# Analysis Service — Service Contract

## Provided — To Frontend (React)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| POST | `/api/analysis/validate` | Validate all submissions for a quiz | `ValidateDto` | 201 |
| GET | `/api/analysis/{submission_id}` | Get stored analysis results | - | `AnalysisDetail` 200 / 404 |
| GET | `/api/analysis/dashboard` | Aggregated class overview | - | `DashboardData` 200 |

## Provided — To Other Services

None. Analysis Service does not serve other backend services.

## Consumed — From Other Services

None. Analysis Service reads submission and quiz data directly from the shared Neon database (read-only on tables it doesn't own).

## Consumed — From External

| Provider | Purpose |
|----------|---------|
| Claude CLI (subprocess) | Validate reasoning, detect AI-generated, apply eval_criteria |
| Neon (PostgreSQL) | Read/write analyses, answer_analyses |

## DTOs

```
ValidateDto { quiz_id }

AnalysisDetail {
  id, submission_id, status, overall_score, overall,
  per_answer: [
    { answer_id, score, strengths, gaps, is_ai_generated, confidence }
  ]
}

DashboardData {
  total_submissions,
  analyzed_count,
  average_score,
  common_gaps,
  ai_flag_count
}
```

## Analysis Status

| Status | Meaning |
|--------|---------|
| `pending` | Analysis created, Claude processing |
| `completed` | All answers validated, scores calculated |
| `failed` | Claude subprocess error |

## Re-analysis

If analysis already exists for a submission, old analysis is deleted and replaced.

## Error Responses

| Status | When |
|--------|------|
| 200 | Success (GET) |
| 201 | Analysis created and completed |
| 404 | Submission or analysis not found |
| 500 | Claude CLI subprocess failure |
