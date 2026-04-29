import mockQuizzes from '../mocks/quizzes';

// Swap this to real API call later:
// export async function fetchQuizzes() {
//   const res = await fetch('/api/quizzes');
//   return res.json();
// }

export async function fetchQuizzes() {
  return mockQuizzes;
}
