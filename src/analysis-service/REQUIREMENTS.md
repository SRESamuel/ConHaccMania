# Analysis Service — Requirements

## Functional Requirements

- Instructor can trigger AI validation for all submissions of a quiz
- AI validates each student's reasoning using Claude CLI (subprocess)
- AI detects potentially AI-generated reasoning
- Instructor-defined eval_criteria is injected into the Claude prompt
- Instructor can view per-student analysis (score, strengths, gaps, AI flag)
- Instructor can view aggregated class dashboard (avg score, common gaps, AI flag count)
- Re-analysis replaces previous results

## Use Cases

- **UC3**: AI validates submission — see `docs/sequence-ai-validates.png`
- **UC4**: Instructor views dashboard — see `docs/sequence-instructor-dashboard.png`

## Database

- Owns: `analyses`, `answer_analyses`
- Connection: Neon (PostgreSQL) via `DATABASE_URL`

## AI Integration

- **Claude CLI** via Python `subprocess` — uses subscription, not API
- No API key needed, no cost
