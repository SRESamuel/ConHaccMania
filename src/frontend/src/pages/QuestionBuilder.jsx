import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuizForEdit, addQuestion, generateWrongOptions, addSolution } from '../api/questions';

export default function QuestionBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [scenario, setScenario] = useState('');
  const [evalCriteria, setEvalCriteria] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('csharp');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(null); // question id being generated
  const [generatedOptions, setGeneratedOptions] = useState([]); // pending accept/reject
  const [saving, setSaving] = useState(null); // index being saved

  const loadQuiz = () => fetchQuizForEdit(id).then(setQuiz);

  const handleGenerate = async (questionId) => {
    setGenerating(questionId);
    setGeneratedOptions([]);
    try {
      const result = await generateWrongOptions(questionId, 2);
      setGeneratedOptions(result.generated_options || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  };

  const handleAccept = async (questionId, option, index) => {
    setSaving(index);
    try {
      const q = quiz.questions.find(q => q.id === questionId);
      const lang = q?.solutions[0]?.language || 'csharp';
      await addSolution(questionId, {
        code: option.code,
        language: lang,
        hint: option.hint,
        why_wrong: option.why_wrong,
      });
      setGeneratedOptions(prev => prev.filter((_, i) => i !== index));
      await loadQuiz();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleReject = (index) => {
    setGeneratedOptions(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => { loadQuiz(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await addQuestion(id, {
        scenario,
        eval_criteria: evalCriteria || null,
        correct_solution: { code, language, hint: hint || null },
      });
      setScenario('');
      setEvalCriteria('');
      setCode('');
      setHint('');
      setShowForm(false);
      await loadQuiz();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) return <div style={{ padding: '20px 24px' }}>Loading...</div>;

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#202122', marginBottom: '4px' };
  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #cdd5dc', borderRadius: '4px', marginBottom: '16px', fontFamily: 'inherit' };
  const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical' };
  const codeStyle = { ...inputStyle, minHeight: '150px', fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', whiteSpace: 'pre', resize: 'vertical' };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', marginBottom: '8px' }}>
        <a href="/quizzes" style={{ color: '#006fbf' }} onClick={(e) => { e.preventDefault(); navigate('/quizzes'); }}>Quiz List</a>
        <span style={{ color: '#6e7477', margin: '0 6px' }}>›</span>
        <span style={{ color: '#6e7477' }}>Edit</span>
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 400, color: '#202122', marginBottom: '4px' }}>
        {quiz.title}
      </h1>
      <div style={{ fontSize: '13px', color: '#6e7477', marginBottom: '24px' }}>
        {quiz.course} — {quiz.created_by} — {quiz.questions.length} question(s)
      </div>

      {/* Existing Questions */}
      {quiz.questions.map((q, i) => (
        <div key={q.id} style={{ border: '1px solid #e3e9f1', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#006fbf', marginBottom: '8px' }}>
              QUESTION {i + 1}
            </div>
            <div style={{ fontSize: '12px', color: '#90989d' }}>
              {q.solutions.length} solution(s)
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#494c4e', lineHeight: 1.6, marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
            {q.scenario}
          </div>
          {q.eval_criteria && (
            <div style={{ fontSize: '12px', color: '#6e7477', fontStyle: 'italic' }}>
              Eval criteria: {q.eval_criteria}
            </div>
          )}
          <div style={{ marginTop: '12px' }}>
            {q.solutions.map((s) => (
              <div key={s.id} style={{
                display: 'flex', gap: '8px', alignItems: 'flex-start',
                padding: '8px', marginBottom: '4px', borderRadius: '4px',
                background: s.is_correct ? '#e7ffe3' : '#f9fbff'
              }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: s.is_correct ? '#027a21' : '#cdd5dc', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700
                }}>{s.label}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#6e7477', marginBottom: '4px' }}>
                    {s.hint} — {s.language} {s.is_correct && '✓ correct'}
                  </div>
                  <pre style={{
                    fontSize: '12px', background: '#1e1e1e', color: '#d4d4d4',
                    padding: '8px', borderRadius: '4px', overflow: 'auto',
                    margin: 0, whiteSpace: 'pre-wrap'
                  }}>{s.code}</pre>
                  {s.why_wrong && (
                    <div style={{ fontSize: '12px', color: '#cd2026', marginTop: '4px' }}>
                      Why wrong: {s.why_wrong}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Generate Wrong Options Button */}
          {q.solutions.filter(s => !s.is_correct).length < 2 && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => handleGenerate(q.id)}
                disabled={generating === q.id}
                style={{
                  background: '#e87511', color: '#fff', border: 'none',
                  borderRadius: '4px', padding: '8px 16px', fontSize: '13px',
                  fontWeight: 600, cursor: generating === q.id ? 'wait' : 'pointer'
                }}
              >
                {generating === q.id ? 'Generating with Gemini...' : '🤖 Generate Wrong Options'}
              </button>
            </div>
          )}

          {/* Generated Options — Accept/Reject */}
          {generatedOptions.length > 0 && (
            <div style={{ marginTop: '16px', border: '1px dashed #e87511', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#e87511', marginBottom: '12px' }}>
                AI-Generated Options (review and accept/reject)
              </div>
              {generatedOptions.map((opt, idx) => (
                <div key={idx} style={{ background: '#fff9f0', padding: '12px', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6e7477', marginBottom: '4px' }}>
                    {opt.hint}
                  </div>
                  <pre style={{
                    fontSize: '12px', background: '#1e1e1e', color: '#d4d4d4',
                    padding: '8px', borderRadius: '4px', overflow: 'auto',
                    margin: '0 0 8px', whiteSpace: 'pre-wrap'
                  }}>{opt.code}</pre>
                  <div style={{ fontSize: '12px', color: '#cd2026', marginBottom: '8px' }}>
                    Why wrong: {opt.why_wrong}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAccept(q.id, opt, idx)}
                      disabled={saving === idx}
                      style={{
                        background: '#027a21', color: '#fff', border: 'none',
                        borderRadius: '3px', padding: '4px 14px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {saving === idx ? 'Saving...' : '✓ Accept'}
                    </button>
                    <button
                      onClick={() => handleReject(idx)}
                      style={{
                        background: '#cd2026', color: '#fff', border: 'none',
                        borderRadius: '3px', padding: '4px 14px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleGenerate(q.id)}
                disabled={generating === q.id}
                style={{
                  background: 'transparent', color: '#e87511', border: '1px solid #e87511',
                  borderRadius: '4px', padding: '6px 14px', fontSize: '12px',
                  cursor: 'pointer', marginTop: '4px'
                }}
              >
                🔄 Regenerate More
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add Question */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: '#006fbf', color: '#fff', border: 'none',
            borderRadius: '4px', padding: '10px 24px', fontSize: '14px',
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          + Add Question
        </button>
      ) : (
        <div style={{ border: '1px solid #006fbf', borderRadius: '6px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>New Question</h3>

          {error && (
            <div style={{ background: '#ffede8', color: '#cd2026', padding: '10px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Scenario (business problem — no technical terms)</label>
            <textarea
              style={textareaStyle}
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe a real-world situation where the student needs to compare code solutions..."
              required
            />

            <label style={labelStyle}>Evaluation Criteria (what AI should look for in reasoning)</label>
            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={evalCriteria}
              onChange={(e) => setEvalCriteria(e.target.value)}
              placeholder="e.g., Does the student identify structural equality vs identity equality?"
            />

            <label style={labelStyle}>Correct Solution (code)</label>
            <textarea
              style={codeStyle}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the correct code solution here..."
              required
            />

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Language</label>
                <select
                  style={inputStyle}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="csharp">C#</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Hint (short label)</label>
                <input
                  style={inputStyle}
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="e.g., ValueObject with structural equality"
                />
              </div>
            </div>

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
                {loading ? 'Adding...' : 'Add Question'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
      )}
    </div>
  );
}
