const API_BASE = 'http://127.0.0.1:8001';

// List quizzes — real API
export async function fetchQuizzes() {
  const res = await fetch(`${API_BASE}/api/quizzes`);
  if (!res.ok) throw new Error(`Failed to fetch quizzes: ${res.status}`);
  return res.json();
}

// Create quiz — real API
export async function createQuiz({ title, course, created_by }) {
  const res = await fetch(`${API_BASE}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, course, created_by }),
  });
  if (!res.ok) throw new Error(`Failed to create quiz: ${res.status}`);
  return res.json();
}
