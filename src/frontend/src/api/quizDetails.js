const API_BASE = 'http://127.0.0.1:8001';

export async function fetchQuizDetail(id) {
  const res = await fetch(`${API_BASE}/api/quizzes/${id}?role=student`);
  if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.status}`);
  return res.json();
}
