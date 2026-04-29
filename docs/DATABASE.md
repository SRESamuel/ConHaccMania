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

## Schema

### ERD

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
                     └──────────────────┘     │ is_correct   │
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
│ overall_score│     │ score            │
│ overall      │     │ concepts_found   │
│  (JSONB)     │     │  (JSONB)         │
│ created_at   │     │ strengths (JSONB)│
└──────────────┘     │ gaps (JSONB)     │
                     │ is_ai_generated  │
                     │ confidence       │
                     └──────────────────┘
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
| quiz_id | UUID | FK → quizzes.id, NOT NULL | |
| scenario | TEXT | NOT NULL | Scenario description |
| eval_criteria | TEXT | | Instructor's evaluation instructions for AI |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### solutions

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| question_id | UUID | FK → questions.id, NOT NULL | |
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
| quiz_id | UUID | FK → quizzes.id, NOT NULL | |
| student_name | VARCHAR(255) | NOT NULL | |
| submitted_at | TIMESTAMPTZ | DEFAULT now() | |

### answers

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| submission_id | UUID | FK → submissions.id, NOT NULL | |
| question_id | UUID | FK → questions.id, NOT NULL | |
| selected_solution_id | UUID | FK → solutions.id, NOT NULL | Which solution student picked |
| reasoning | TEXT | NOT NULL | Student's explanation |

### analyses

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| submission_id | UUID | FK → submissions.id, UNIQUE, NOT NULL | 1:1 with submission |
| overall_score | INTEGER | | 0-100 |
| overall | JSONB | | `{ strengths, areas_for_improvement, recommended_topics, criteria_alignment }` |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### answer_analyses

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| analysis_id | UUID | FK → analyses.id, NOT NULL | |
| answer_id | UUID | FK → answers.id, NOT NULL | |
| score | INTEGER | | 0-100 per question |
| concepts_found | JSONB | DEFAULT '[]' | Concepts student demonstrated |
| strengths | JSONB | DEFAULT '[]' | What they got right |
| gaps | JSONB | DEFAULT '[]' | What they missed |
| is_ai_generated | BOOLEAN | DEFAULT false | Flag if reasoning seems AI-written |
| confidence | REAL | | 0.0-1.0 AI confidence in assessment |

---

## SQL — Create Tables

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === Quiz API owns ===

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

-- === Submission API owns ===

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    student_name VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    selected_solution_id UUID NOT NULL REFERENCES solutions(id),
    reasoning TEXT NOT NULL
);

-- === Analysis Service owns ===

CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES submissions(id),
    overall_score INTEGER,
    overall JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE answer_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    answer_id UUID NOT NULL REFERENCES answers(id),
    score INTEGER,
    concepts_found JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    gaps JSONB DEFAULT '[]',
    is_ai_generated BOOLEAN DEFAULT false,
    confidence REAL
);
```

---

## Service Ownership

Each service is responsible for its own tables. Cross-service reads are allowed, but writes only through the owning service.

| Table | Owner | Other services |
|-------|-------|---------------|
| quizzes | Quiz API | Submission API reads (FK), Analysis reads |
| questions | Quiz API | Submission API reads, Analysis reads |
| solutions | Quiz API | Submission API reads, Analysis reads |
| submissions | Submission API | Analysis reads |
| answers | Submission API | Analysis reads |
| analyses | Analysis Service | Frontend reads via Analysis API |
| answer_analyses | Analysis Service | Frontend reads via Analysis API |

---

## JSONB Field Schemas

### overall (analyses)
```json
{
  "strengths": ["Strong time complexity understanding"],
  "areas_for_improvement": ["Explore space-time tradeoffs"],
  "recommended_topics": ["Defensive Programming"],
  "criteria_alignment": {
    "Time Complexity": 95,
    "Error Handling": 60,
    "Readability": 80
  }
}
```
