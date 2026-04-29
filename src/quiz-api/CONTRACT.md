# Quiz API — Service Contract

## Provided — To Frontend (React)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/quizzes` | List all quizzes | - | `Quiz[]` 200 |
| POST | `/api/quizzes` | Create quiz | `CreateQuizDto` | 201 |
| GET | `/api/quizzes/{id}?role=student` | Get quiz for student (hides is_correct, why_wrong) | - | `QuizDetail` 200 / 404 |
| GET | `/api/quizzes/{id}?role=instructor` | Get quiz with full solution data (default) | - | `QuizDetail` 200 / 404 |
| POST | `/api/quizzes/{id}/questions` | Add question with correct solution | `CreateQuestionDto` | 201 |
| PUT | `/api/questions/{id}` | Update question | `UpdateQuestionDto` | 200 / 404 |
| POST | `/api/questions/{id}/generate-wrong-options` | AI generates wrong options | `GenerateDto` | `GeneratedOption[]` 200 |
| POST | `/api/questions/{id}/solutions` | Save accepted wrong option | `CreateSolutionDto` | 201 |

### Role Query Parameter

`GET /api/quizzes/{id}?role=`

| Value | Behavior |
|-------|----------|
| `student` | Hides `is_correct` and `why_wrong` from solutions |
| `instructor` (default) | Returns full solution data |

No auth, no header. Role is a simple query param.

## Provided — To Other Services

None via API. Analysis Service reads quizzes/questions/solutions tables directly from shared DB (read-only).

## Consumed — From Other Services

None.

## Consumed — From External

| Provider | Purpose |
|----------|---------|
| Gemini API | Generate plausible wrong options from correct solution |
| Neon (PostgreSQL) | Read/write quizzes, questions, solutions |

## DTOs

```
Quiz { id, title, course, created_by, created_at }
QuizDetail { id, title, course, created_by, questions[] }
Question { id, quiz_id, scenario, eval_criteria, solutions[] }
Solution { id, label, code, language, hint, is_correct, why_wrong }
SolutionStudentView { id, label, code, language, hint }

CreateQuizDto { title, course, created_by }
CreateQuestionDto { scenario, eval_criteria, correct_solution: { code, language, hint } }
UpdateQuestionDto { scenario, eval_criteria }
GenerateDto { count }
CreateSolutionDto { code, language, hint, why_wrong }
GeneratedOption { code, language, hint, why_wrong }
```

## Error Responses

| Status | When |
|--------|------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Invalid input |
| 404 | Quiz or question not found |
