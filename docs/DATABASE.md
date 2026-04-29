# NewGenLearning — Database Contract

## Overview

Single shared Neon (PostgreSQL) database accessed by all 3 services.

| Service | Access | Tables |
|---------|--------|--------|
| Quiz API | read/write | quizzes, questions, solutions |
| Submission API | read/write | submissions, answers |
| Analysis Service | read/write | analyses, answer_analyses |

---

## Connection

- **Provider**: Neon (serverless PostgreSQL)
- **Single DB**: All services share one database
- **Connection**: Each service connects via `DATABASE_URL` env var

---

## ERD

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   quizzes    │     │    questions      │     │  solutions   │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id (PK)      │──┐  │ id (PK)          │──┐  │ id (PK)      │
│ title        │  └─→│ quiz_id (FK)     │  └─→│ question_id  │
│ course       │     │ scenario         │     │  (FK)        │
│ created_by   │     │ eval_criteria    │     │ label        │
│ created_at   │     │ created_at       │     │ code         │
└──────────────┘     └──────────────────┘     │ language     │
                                               │ hint         │
                                               │ is_correct   │
                                               │ why_wrong    │
                                               └──────────────┘

┌──────────────┐     ┌──────────────────┐
│ submissions  │     │    answers       │
├──────────────┤     ├──────────────────┤
│ id (PK)      │──┐  │ id (PK)          │
│ quiz_id (FK) │  └─→│ submission_id    │
│ student_name │     │  (FK)            │
│ submitted_at │     │ question_id (FK) │
└──────────────┘     │ selected_solution│
                     │  _id (FK)        │
                     │ reasoning        │
                     └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│  analyses    │     │ answer_analyses  │
├──────────────┤     ├──────────────────┤
│ id (PK)      │──┐  │ id (PK)          │
│ submission_id│  └─→│ analysis_id (FK) │
│  (FK)        │     │ answer_id (FK)   │
│ status       │     │ score            │
│ overall_score│     │ strengths (JSONB)│
│ overall      │     │ gaps (JSONB)     │
│  (JSONB)     │     │ is_ai_generated  │
│ created_at   │     │ confidence       │
└──────────────┘     └──────────────────┘
```

---

## Tables

### quizzes

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| title | VARCHAR(255) | NOT NULL | "Assessment 1: Array Operations" |
| course | VARCHAR(100) | NOT NULL | "PROG2070" |
| created_by | VARCHAR(100) | NOT NULL | Instructor name or ID |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### questions

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| quiz_id | UUID | FK → quizzes.id CASCADE, NOT NULL | |
| scenario | TEXT | NOT NULL | Scenario description |
| eval_criteria | TEXT | | Instructor's text instructions for AI validation |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### solutions

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| question_id | UUID | FK → questions.id CASCADE, NOT NULL | |
| label | VARCHAR(1) | NOT NULL | "A", "B", "C" |
| code | TEXT | NOT NULL | Code block content |
| language | VARCHAR(50) | NOT NULL | "python", "javascript", etc. |
| hint | VARCHAR(255) | | "Nested loop approach" |
| is_correct | BOOLEAN | NOT NULL, DEFAULT false | |
| why_wrong | TEXT | | NULL if correct, explanation if wrong |

### submissions

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| quiz_id | UUID | FK → quizzes.id CASCADE, NOT NULL | |
| student_name | VARCHAR(255) | NOT NULL | |
| submitted_at | TIMESTAMPTZ | DEFAULT now() | |

### answers

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| submission_id | UUID | FK → submissions.id CASCADE, NOT NULL | |
| question_id | UUID | FK → questions.id CASCADE, NOT NULL | |
| selected_solution_id | UUID | FK → solutions.id, NOT NULL | Frontend maps label (A/B/C) → UUID |
| reasoning | TEXT | NOT NULL | Student's explanation |

### analyses

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| submission_id | UUID | FK → submissions.id CASCADE, NOT NULL | |
| status | VARCHAR(20) | DEFAULT 'pending' | 'pending', 'completed', 'failed' |
| overall_score | NUMERIC(5,2) | | 0-100, averaged from answer scores |
| overall | JSONB | | `{ strengths, areas_for_improvement, recommended_topics }` |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

> **Re-analysis**: If instructor runs analysis again, old analysis is deleted and replaced. Application handles this — no UNIQUE constraint on submission_id.

### answer_analyses

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| analysis_id | UUID | FK → analyses.id CASCADE, NOT NULL | |
| answer_id | UUID | FK → answers.id CASCADE, NOT NULL | |
| score | INTEGER | | 0-100 per question |
| strengths | JSONB | DEFAULT '[]' | What they got right |
| gaps | JSONB | DEFAULT '[]' | What they missed |
| is_ai_generated | BOOLEAN | DEFAULT false | Flag if reasoning seems AI-written |
| confidence | REAL | | 0.0-1.0 AI confidence in assessment |

---

## SQL

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === Quiz API ===

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    course VARCHAR(100) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    eval_criteria TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    label VARCHAR(1) NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    hint VARCHAR(255),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    why_wrong TEXT
);

-- === Submission API ===

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_solution_id UUID NOT NULL REFERENCES solutions(id),
    reasoning TEXT NOT NULL
);

-- === Analysis Service ===

CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    overall_score NUMERIC(5,2),
    overall JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE answer_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    score INTEGER,
    strengths JSONB DEFAULT '[]',
    gaps JSONB DEFAULT '[]',
    is_ai_generated BOOLEAN DEFAULT false,
    confidence REAL
);

-- === Indexes ===

CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_solutions_question ON solutions(question_id);
CREATE INDEX idx_submissions_quiz ON submissions(quiz_id);
CREATE INDEX idx_submissions_student ON submissions(student_name);
CREATE INDEX idx_answers_submission ON answers(submission_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_analyses_submission ON analyses(submission_id);
CREATE INDEX idx_answer_analyses_analysis ON answer_analyses(analysis_id);
```

---

## Service Ownership

Each service owns its tables. Cross-service reads allowed, writes only through owning service.

| Table | Owner | Other services |
|-------|-------|---------------|
| quizzes | Quiz API | Submission API reads, Analysis reads |
| questions | Quiz API | Submission API reads, Analysis reads |
| solutions | Quiz API | Submission API reads, Analysis reads |
| submissions | Submission API | Analysis reads |
| answers | Submission API | Analysis reads |
| analyses | Analysis Service | Frontend reads via Analysis API |
| answer_analyses | Analysis Service | Frontend reads via Analysis API |

---

## JSONB Schemas

### overall (analyses)

```json
{
  "strengths": ["Strong time complexity understanding"],
  "areas_for_improvement": ["Explore space-time tradeoffs"],
  "recommended_topics": ["Defensive Programming"]
}
```
