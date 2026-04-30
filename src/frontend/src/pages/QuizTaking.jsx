import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuizForStudent, submitAnswers } from '../api/quizTaking';
import { useRole } from '../context/RoleContext';

export default function QuizTaking() {
  const { currentUser } = useRole();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizForStudent(id).then(setQuiz);
  }, [id]);

  if (!quiz) return <div style={{ padding: '20px 24px' }}>Loading...</div>;

  const question = quiz.questions[currentQ];
  const answer = answers[question.id] || { selected: null, reasoning: '' };

  const updateAnswer = (field, value) => {
    setAnswers(prev => ({
      ...prev,
      [question.id]: { ...prev[question.id], selected: prev[question.id]?.selected || null, reasoning: prev[question.id]?.reasoning || '', [field]: value }
    }));
  };

  const answeredCount = Object.values(answers).filter(a => a.selected && a.reasoning).length;

  const handleSubmit = async () => {
    if (answeredCount < quiz.questions.length) {
      if (!confirm(`You have answered ${answeredCount}/${quiz.questions.length} questions. Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      await submitAnswers({
        quiz_id: id,
        student_name: currentUser.name,
        answers: Object.entries(answers).map(([qid, a]) => ({
          question_id: qid,
          selected_solution_id: a.selected,
          reasoning: a.reasoning,
        })),
      });
      alert('Submitted successfully!');
      navigate('/quizzes');
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6e7477' }}>{quiz.title}</div>
          <div style={{ fontSize: '12px', color: '#90989d' }}>
            Question {currentQ + 1} of {quiz.questions.length} — {answeredCount} answered
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {quiz.questions.map((q, i) => {
            const a = answers[q.id];
            const done = a?.selected && a?.reasoning;
            return (
              <div
                key={q.id}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  background: i === currentQ ? '#006fbf' : done ? '#027a21' : '#e3e9f1',
                  color: i === currentQ || done ? '#fff' : '#494c4e',
                }}
              >{i + 1}</div>
            );
          })}
        </div>
      </div>

      {/* Scenario */}
      <div style={{
        background: '#f9fbff', border: '1px solid #e3e9f1', borderRadius: '6px',
        padding: '20px', marginBottom: '20px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#006fbf', marginBottom: '8px' }}>SCENARIO</div>
        <div style={{ fontSize: '14px', color: '#202122', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {question.scenario}
        </div>
      </div>

      {/* Solutions */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#494c4e', marginBottom: '12px' }}>
          Select the best solution:
        </div>
        {question.solutions.map((s) => (
          <div
            key={s.id}
            onClick={() => updateAnswer('selected', s.id)}
            style={{
              border: answer.selected === s.id ? '2px solid #006fbf' : '1px solid #e3e9f1',
              background: answer.selected === s.id ? '#e8f8ff' : '#fff',
              borderRadius: '6px', padding: '12px', marginBottom: '8px', cursor: 'pointer',
              transition: 'border 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                background: answer.selected === s.id ? '#006fbf' : '#cdd5dc', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700
              }}>{s.label}</span>
              <span style={{ fontSize: '12px', color: '#6e7477' }}>Solution {s.label}</span>
            </div>
            <pre style={{
              fontSize: '12px', background: '#1e1e1e', color: '#d4d4d4',
              padding: '10px', borderRadius: '4px', overflow: 'auto',
              margin: 0, whiteSpace: 'pre-wrap'
            }}>{s.code}</pre>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#494c4e', marginBottom: '4px' }}>
          Explain your reasoning <span style={{ color: '#cd2026' }}>*</span>
        </label>
        <div style={{ fontSize: '12px', color: '#6e7477', marginBottom: '8px' }}>
          Why did you choose this solution? What are the tradeoffs compared to the alternatives?
        </div>
        <textarea
          value={answer.reasoning}
          onChange={(e) => updateAnswer('reasoning', e.target.value)}
          placeholder="Explain why the solution you selected is the best approach..."
          style={{
            width: '100%', minHeight: '120px', padding: '10px', fontSize: '14px',
            border: '1px solid #cdd5dc', borderRadius: '4px', fontFamily: 'inherit',
            lineHeight: 1.6, resize: 'vertical'
          }}
        />
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e3e9f1', paddingTop: '16px' }}>
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          style={{
            background: '#e3e9f1', color: '#494c4e', border: 'none',
            borderRadius: '4px', padding: '8px 20px', fontSize: '14px',
            cursor: currentQ === 0 ? 'default' : 'pointer',
            opacity: currentQ === 0 ? 0.5 : 1
          }}
        >Previous</button>

        {currentQ < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            style={{
              background: '#006fbf', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '8px 20px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >Next</button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: '#027a21', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '8px 20px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >Submit Assessment</button>
        )}
      </div>
    </div>
  );
}
