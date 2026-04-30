const SUBMISSION_API = 'http://127.0.0.1:8002';
const ANALYSIS_API = 'http://127.0.0.1:8003';

export async function fetchSubmissions(quizId) {
  const res = await fetch(`${SUBMISSION_API}/api/submissions?quiz_id=${quizId}`);
  if (!res.ok) throw new Error(`Failed to fetch submissions: ${res.status}`);
  return res.json();
}

export async function fetchSubmissionDetail(submissionId) {
  const res = await fetch(`${SUBMISSION_API}/api/submissions/${submissionId}`);
  if (!res.ok) throw new Error(`Failed to fetch submission: ${res.status}`);
  return res.json();
}

export async function triggerAnalysis(quizId) {
  const res = await fetch(`${ANALYSIS_API}/api/analysis/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId }),
  });
  if (!res.ok) throw new Error(`Failed to trigger analysis: ${res.status}`);
  return res.json();
}

export async function fetchAnalysis(submissionId) {
  const res = await fetch(`${ANALYSIS_API}/api/analysis/${submissionId}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch analysis: ${res.status}`);
  }
  return res.json();
}

export async function fetchDashboard(quizId) {
  const url = quizId
    ? `${ANALYSIS_API}/api/analysis/dashboard?quiz_id=${quizId}`
    : `${ANALYSIS_API}/api/analysis/dashboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch dashboard: ${res.status}`);
  return res.json();
}
