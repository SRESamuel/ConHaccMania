import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { fetchQuizzes } from '../api/quizzes';

export default function QuizList() {
  const { role } = useRole();
  const isInstructor = role === 'instructor';
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [hiddenIds, setHiddenIds] = useState(() => {
    const saved = localStorage.getItem('hiddenQuizIds');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchQuizzes().then(setQuizzes);
  }, []);

  const toggleVisibility = (id) => {
    setHiddenIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      localStorage.setItem('hiddenQuizIds', JSON.stringify(next));
      return next;
    });
  };

  const visibleQuizzes = isInstructor
    ? quizzes
    : quizzes.filter(q => !hiddenIds.includes(q.id));

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 400, color: '#202122' }}>
          Quiz List
        </h1>
        {isInstructor && (
          <button
            onClick={() => navigate('/quizzes/create')}
            style={{
              background: '#006fbf', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '8px 20px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            + Create Quiz
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e3e9f1' }}>
        <thead>
          <tr style={{ background: '#f9fbff', borderBottom: '2px solid #e3e9f1' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
              Current Quizzes
            </th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
              Course
            </th>
            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
              Created By
            </th>
            {isInstructor && (
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
                Visible
              </th>
            )}
            {isInstructor && (
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleQuizzes.map((quiz) => {
            const isHidden = hiddenIds.includes(quiz.id);
            return (
              <tr
                key={quiz.id}
                style={{
                  borderBottom: '1px solid #e3e9f1',
                  opacity: isInstructor && isHidden ? 0.5 : 1
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <a href={`/quiz/${quiz.id}`} style={{ color: '#006fbf', fontSize: '14px' }}>
                    {quiz.title}
                  </a>
                  {isInstructor && isHidden && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#cd2026', fontWeight: 600 }}>
                      HIDDEN
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#494c4e' }}>
                  {quiz.course}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#494c4e', textAlign: 'center' }}>
                  {quiz.created_by}
                </td>
                {isInstructor && (
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleVisibility(quiz.id)}
                      style={{
                        background: isHidden ? '#e3e9f1' : '#006fbf',
                        color: isHidden ? '#494c4e' : '#fff',
                        border: 'none', borderRadius: '3px',
                        padding: '4px 12px', fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {isHidden ? 'Show' : 'Hide'}
                    </button>
                  </td>
                )}
                {isInstructor && (
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span onClick={() => navigate(`/quiz/${quiz.id}/edit`)} style={{ color: '#006fbf', fontSize: '13px', marginRight: '12px', cursor: 'pointer' }}>
                      Edit
                    </span>
                    <span onClick={() => navigate(`/quiz/${quiz.id}/submissions`)} style={{ color: '#006fbf', fontSize: '13px', cursor: 'pointer' }}>
                      Submissions
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
