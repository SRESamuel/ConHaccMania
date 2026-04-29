import { useEffect, useState } from 'react';
import { fetchQuizzes } from '../api/quizzes';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchQuizzes().then(setQuizzes);
  }, []);

  return (
    <div style={{ padding: '20px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 400, color: '#202122', marginBottom: '24px' }}>
        Quiz List
      </h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e3e9f1' }}>
        <thead>
          <tr style={{ background: '#f9fbff', borderBottom: '2px solid #e3e9f1' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
              Current Quizzes
            </th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
              Evaluation Status
            </th>
            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
              Attempts
            </th>
          </tr>
        </thead>
        <tbody>
          {quizzes.map((quiz) => (
            <tr key={quiz.id} style={{ borderBottom: '1px solid #e3e9f1' }}>
              <td style={{ padding: '14px 16px' }}>
                <a href={`/quiz/${quiz.id}`} style={{ color: '#006fbf', fontSize: '14px' }}>
                  {quiz.name}
                </a>
                <span style={{ marginLeft: '8px', color: '#90989d', fontSize: '12px' }}>▾</span>
              </td>
              <td style={{ padding: '14px 16px', fontSize: '14px', color: '#494c4e' }}>
                Feedback: <a href="#" style={{ color: '#006fbf' }}>{quiz.status}</a>
              </td>
              <td style={{ padding: '14px 16px', fontSize: '14px', color: '#494c4e', textAlign: 'center' }}>
                {quiz.attempts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
