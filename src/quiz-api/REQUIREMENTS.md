# Quiz API — Requirements

## Functional Requirements

- Instructor can create quizzes with title, course, and name
- Instructor can add scenario-based questions with correct solution
- Instructor can set eval_criteria (text) per question for AI validation
- Instructor can generate wrong options via Gemini API
- Instructor can accept, reject, or regenerate wrong options
- Frontend can fetch quiz with questions and solutions (student view excludes is_correct, why_wrong)

## Use Cases

- **UC1**: Instructor creates question — see `docs/sequence-create-question.png`

## Database

- Owns: `quizzes`, `questions`, `solutions`
- Connection: Neon (PostgreSQL) via `DATABASE_URL`

## AI Integration

- **Gemini API** (google-generativeai) for wrong option generation
- Free tier: Gemini 2.5 Flash (20-50 requests/day)
