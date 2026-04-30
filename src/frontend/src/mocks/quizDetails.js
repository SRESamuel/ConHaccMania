// Mock data — will be replaced with API call: GET /api/quizzes/{id}?role=student
const mockQuizDetails = {
  1: {
    id: 1,
    title: 'My Rights and Responsibilities',
    currentUser: 'Jindo Kim (username: JKimCC11451755)',
    timeLimit: 'No time limit (estimated time required: 120 minutes)',
    attemptsAllowed: 3,
    attemptsCompleted: 3,
  },
  2: {
    id: 2,
    title: 'My Academic Integrity',
    currentUser: 'Jindo Kim (username: JKimCC11451755)',
    timeLimit: 'No time limit (estimated time required: 120 minutes)',
    attemptsAllowed: 3,
    attemptsCompleted: 1,
    attemptInProgress: 2,
  },
  3: {
    id: 3,
    title: 'My Community',
    currentUser: 'Jindo Kim (username: JKimCC11451755)',
    timeLimit: 'No time limit (estimated time required: 120 minutes)',
    attemptsAllowed: 3,
    attemptsCompleted: 1,
  },
  4: {
    id: 4,
    title: 'My Career',
    currentUser: 'Jindo Kim (username: JKimCC11451755)',
    timeLimit: 'No time limit (estimated time required: 120 minutes)',
    attemptsAllowed: 3,
    attemptsCompleted: 1,
  },
};

export default mockQuizDetails;
