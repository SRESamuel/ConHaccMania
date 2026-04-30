import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSubmissions, triggerAnalysis, fetchAnalysis } from '../api/analysis';

export default function InstructorDashboard() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmissions(quizId).then(setSubmissions);
  }, [quizId]);

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    setAnalyzeResult(null);
    setError(null);
    try {
      const result = await triggerAnalysis(quizId);
      setAnalyzeResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewAnalysis = async (submissionId) => {
    setSelectedSub(submissionId);
    setAnalysis(null);
    setLoadingAnalysis(true);
    try {
      const result = await fetchAnalysis(submissionId);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', marginBottom: '8px' }}>
        <a href="/quizzes" style={{ color: '#006fbf' }} onClick={(e) => { e.preventDefault(); navigate('/quizzes'); }}>Quiz List</a>
        <span style={{ color: '#6e7477', margin: '0 6px' }}>›</span>
        <span style={{ color: '#6e7477' }}>Submissions</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 400, color: '#202122' }}>
          Student Submissions
        </h1>
        <button
          onClick={handleAnalyzeAll}
          disabled={analyzing}
          style={{
            background: '#085394', color: '#fff', border: 'none',
            borderRadius: '4px', padding: '10px 24px', fontSize: '14px',
            fontWeight: 600, cursor: analyzing ? 'wait' : 'pointer'
          }}
        >
          {analyzing ? '🤖 Analyzing with Claude...' : '🤖 Analyze All'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ffede8', color: '#cd2026', padding: '10px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {analyzeResult && (
        <div style={{ background: '#e7ffe3', color: '#027a21', padding: '10px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
          Analysis complete — {analyzeResult.analyzed} submission(s) analyzed.
        </div>
      )}

      {/* Submissions Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e3e9f1', marginBottom: '24px' }}>
        <thead>
          <tr style={{ background: '#f9fbff', borderBottom: '2px solid #e3e9f1' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>Student</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>Submitted</th>
            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#494c4e' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => (
            <tr key={sub.id} style={{ borderBottom: '1px solid #e3e9f1', background: selectedSub === sub.id ? '#e8f8ff' : 'transparent' }}>
              <td style={{ padding: '14px 16px', fontSize: '14px', color: '#202122', fontWeight: 500 }}>
                {sub.student_name}
              </td>
              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6e7477' }}>
                {new Date(sub.submitted_at).toLocaleString()}
              </td>
              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                <span
                  onClick={() => handleViewAnalysis(sub.id)}
                  style={{ color: '#006fbf', fontSize: '13px', cursor: 'pointer' }}
                >
                  View Results
                </span>
              </td>
            </tr>
          ))}
          {submissions.length === 0 && (
            <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#6e7477' }}>No submissions yet.</td></tr>
          )}
        </tbody>
      </table>

      {/* Analysis Results */}
      {loadingAnalysis && (
        <div style={{ padding: '20px', color: '#6e7477' }}>Loading analysis...</div>
      )}

      {analysis === null && selectedSub && !loadingAnalysis && (
        <div style={{ padding: '20px', background: '#f9fbff', borderRadius: '6px', border: '1px solid #e3e9f1' }}>
          <div style={{ color: '#6e7477', fontSize: '14px' }}>
            No analysis found for this submission. Click "Analyze All" first.
          </div>
        </div>
      )}

      {analysis && (
        <div style={{ border: '1px solid #e3e9f1', borderRadius: '6px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Analysis Results</h2>
            <div style={{
              fontSize: '28px', fontWeight: 700,
              color: analysis.overall_score >= 80 ? '#027a21' : analysis.overall_score >= 60 ? '#e87511' : '#cd2026'
            }}>
              {analysis.overall_score !== null ? `${Math.round(analysis.overall_score)}%` : 'N/A'}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#6e7477', marginBottom: '4px' }}>
            Status: <span style={{ fontWeight: 600, color: analysis.status === 'completed' ? '#027a21' : '#cd2026' }}>{analysis.status}</span>
          </div>

          {/* Overall */}
          {analysis.overall && (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              {analysis.overall.strengths?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#027a21' }}>Strengths: </span>
                  {analysis.overall.strengths.map((s, i) => (
                    <span key={i} style={{ display: 'inline-block', background: '#e7ffe3', color: '#027a21', padding: '2px 8px', borderRadius: '3px', fontSize: '12px', margin: '2px 4px 2px 0' }}>{s}</span>
                  ))}
                </div>
              )}
              {analysis.overall.areas_for_improvement?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#cd2026' }}>Areas for Improvement: </span>
                  {analysis.overall.areas_for_improvement.map((g, i) => (
                    <span key={i} style={{ display: 'inline-block', background: '#ffede8', color: '#cd2026', padding: '2px 8px', borderRadius: '3px', fontSize: '12px', margin: '2px 4px 2px 0' }}>{g}</span>
                  ))}
                </div>
              )}
              {analysis.overall.recommended_topics?.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#006fbf' }}>Recommended Topics: </span>
                  {analysis.overall.recommended_topics.map((t, i) => (
                    <span key={i} style={{ display: 'inline-block', background: '#e8f8ff', color: '#006fbf', padding: '2px 8px', borderRadius: '3px', fontSize: '12px', margin: '2px 4px 2px 0' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per-Answer */}
          {analysis.per_answer?.map((pa, i) => (
            <div key={i} style={{ border: '1px solid #e3e9f1', borderRadius: '4px', padding: '12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#006fbf' }}>QUESTION {i + 1}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: pa.score >= 80 ? '#027a21' : pa.score >= 60 ? '#e87511' : '#cd2026' }}>
                  {pa.score}/100
                </span>
              </div>
              {pa.is_ai_generated && (
                <div style={{ background: '#ffede8', color: '#cd2026', padding: '4px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'inline-block' }}>
                  ⚠ Possibly AI-Generated
                </div>
              )}
              {pa.strengths?.length > 0 && (
                <div style={{ fontSize: '12px', color: '#027a21', marginBottom: '4px' }}>
                  <strong>Strengths:</strong> {pa.strengths.join(', ')}
                </div>
              )}
              {pa.gaps?.length > 0 && (
                <div style={{ fontSize: '12px', color: '#cd2026' }}>
                  <strong>Gaps:</strong> {pa.gaps.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
