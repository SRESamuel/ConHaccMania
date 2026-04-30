const API_BASE = 'http://127.0.0.1:8001';

// Get quiz with all questions (instructor view)
export async function fetchQuizForEdit(quizId) {
  const res = await fetch(`${API_BASE}/api/quizzes/${quizId}?role=instructor`);
  if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.status}`);
  return res.json();
}

// Add question with correct solution
export async function addQuestion(quizId, { scenario, eval_criteria, correct_solution }) {
  const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, eval_criteria, correct_solution }),
  });
  if (!res.ok) throw new Error(`Failed to add question: ${res.status}`);
  return res.json();
}

// Generate wrong options via Gemini
export async function generateWrongOptions(questionId, count = 2) {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}/generate-wrong-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error(`Failed to generate options: ${res.status}`);
  return res.json();
}

// Save accepted wrong option
export async function addSolution(questionId, { code, language, hint, why_wrong }) {
  const res = await fetch(`${API_BASE}/api/questions/${questionId}/solutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, hint, why_wrong }),
  });
  if (!res.ok) throw new Error(`Failed to add solution: ${res.status}`);
  return res.json();
}
