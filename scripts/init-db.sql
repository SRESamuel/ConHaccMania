CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === Quiz API ===

CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    course VARCHAR(100) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    eval_criteria TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solutions (
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

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_solution_id UUID NOT NULL REFERENCES solutions(id),
    reasoning TEXT NOT NULL
);

-- === Analysis Service ===

CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    overall_score NUMERIC(5,2),
    overall JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answer_analyses (
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

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_solutions_question ON solutions(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_quiz ON submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_name);
CREATE INDEX IF NOT EXISTS idx_answers_submission ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_analyses_submission ON analyses(submission_id);
CREATE INDEX IF NOT EXISTS idx_answer_analyses_analysis ON answer_analyses(analysis_id);
