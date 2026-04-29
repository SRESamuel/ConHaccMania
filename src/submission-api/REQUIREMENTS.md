# Submission API — Requirements

## Functional Requirements

- Student can submit quiz answers with reasoning text per question
- Instructor can list all submissions, filtered by student name
- Instructor can view a single submission with all answers and reasoning

## Use Cases

- **UC2**: Student takes quiz — see `docs/sequence-student-takes-quiz.png`

## Database

- Owns: `submissions`, `answers`
- Connection: Neon (PostgreSQL) via `DATABASE_URL`

## AI Integration

None. Submission API does not call any AI provider.
