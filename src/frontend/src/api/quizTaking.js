const QUIZ_API = 'http://127.0.0.1:8001';
const SUBMISSION_API = 'http://127.0.0.1:8002';

export async function fetchQuizForStudent(quizId) {
  const res = await fetch(`${QUIZ_API}/api/quizzes/${quizId}?role=student`);
  if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.status}`);
  return res.json();
}

export async function submitAnswers({ quiz_id, student_name, answers }) {
  const res = await fetch(`${SUBMISSION_API}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id, student_name, answers }),
  });
  if (!res.ok) throw new Error(`Failed to submit: ${res.status}`);
  return res.json();
}
