import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuizDetail } from '../api/quizDetails';

export default function QuizSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    fetchQuizDetail(id).then(setQuiz);
  }, [id]);

  if (!quiz) return <div style={{ padding: '20px 24px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: '13px', marginBottom: '8px' }}>
        <a href="/quizzes" style={{ color: '#006fbf' }} onClick={(e) => { e.preventDefault(); navigate('/quizzes'); }}>Quiz List</a>
        <span style={{ color: '#6e7477', margin: '0 6px' }}>›</span>
        <span style={{ color: '#6e7477' }}>Summary</span>
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 400, color: '#202122', marginBottom: '24px' }}>
        Summary - {quiz.title}
      </h1>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Quiz Details</h2>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#202122', marginBottom: '4px' }}>Course</div>
        <div style={{ fontSize: '14px', color: '#494c4e' }}>{quiz.course}</div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#202122', marginBottom: '4px' }}>Created By</div>
        <div style={{ fontSize: '14px', color: '#494c4e' }}>{quiz.created_by}</div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#202122', marginBottom: '4px' }}>Questions</div>
        <div style={{ fontSize: '14px', color: '#494c4e' }}>{quiz.questions.length} question(s)</div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Instructions</h2>
      <div style={{ fontSize: '14px', color: '#494c4e', lineHeight: 1.7, marginBottom: '24px' }}>
        <p style={{ marginBottom: '8px' }}>
          Read each scenario carefully. Compare the code solutions provided and select the one you believe is best.
        </p>
        <p style={{ marginBottom: '8px' }}>
          For each question, you must <strong>explain your reasoning</strong> — why you chose that solution and why the alternatives are less suitable.
        </p>
        <p>Your reasoning will be evaluated by AI for depth, accuracy, and understanding.</p>
      </div>

      <button
        onClick={() => navigate(`/quiz/${id}/take`)}
        style={{
          background: '#006fbf', color: '#fff', border: 'none',
          borderRadius: '4px', padding: '10px 24px', fontSize: '14px',
          fontWeight: 600, cursor: 'pointer'
        }}
      >
        Start Assessment
      </button>
    </div>
  );
}
