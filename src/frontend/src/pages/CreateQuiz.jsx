import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../api/quizzes';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [course] = useState('PROG3176');
  const [createdBy] = useState('Aeiman Gadafi');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createQuiz({ title, course, created_by: createdBy });
      navigate('/quizzes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 700,
    color: '#202122', marginBottom: '4px'
  };
  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '14px',
    border: '1px solid #cdd5dc', borderRadius: '4px',
    marginBottom: '16px'
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: '600px' }}>
      <div style={{ fontSize: '13px', marginBottom: '8px' }}>
        <a href="/quizzes" style={{ color: '#006fbf' }}>Quiz List</a>
        <span style={{ color: '#6e7477', margin: '0 6px' }}>›</span>
        <span style={{ color: '#6e7477' }}>Create Quiz</span>
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 400, color: '#202122', marginBottom: '24px' }}>
        Create New Quiz
      </h1>

      {error && (
        <div style={{ background: '#ffede8', color: '#cd2026', padding: '10px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Quiz Title</label>
        <input
          style={inputStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Assessment 1: Array Operations"
          required
        />

        <label style={labelStyle}>Course Code</label>
        <input
          style={{ ...inputStyle, background: '#f1f5fb', color: '#6e7477' }}
          value={course}
          readOnly
        />

        <label style={labelStyle}>Created By</label>
        <input
          style={{ ...inputStyle, background: '#f1f5fb', color: '#6e7477' }}
          value={createdBy}
          readOnly
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#006fbf', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '10px 24px', fontSize: '14px',
              fontWeight: 600, cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/quizzes')}
            style={{
              background: '#e3e9f1', color: '#494c4e', border: 'none',
              borderRadius: '4px', padding: '10px 24px', fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
