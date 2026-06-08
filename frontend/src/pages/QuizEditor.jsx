import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const blank = () => ({ question: '', options: ['', ''], correct_answer: '', time_limit: 30 });

export default function QuizEditor() {
  const { quizId } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();
  const editing = Boolean(quizId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([blank()]);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const q = await api(`/quizzes/${quizId}`);
        setTitle(q.title || '');
        setDescription(q.description || '');
        setQuestions((q.questions || []).length ? q.questions : [blank()]);
      } catch (e) { setErr(e.message); }
    })();
  }, [editing, quizId]);

  const updateQ = (i, patch) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const updateOpt = (i, j, val) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, options: q.options.map((o, oi) => oi === j ? val : o) } : q));
  const addOpt = (i) => updateQ(i, { options: [...questions[i].options, ''] });
  const rmOpt = (i, j) => {
    const opts = questions[i].options.filter((_, oi) => oi !== j);
    updateQ(i, { options: opts, correct_answer: questions[i].correct_answer === questions[i].options[j] ? '' : questions[i].correct_answer });
  };
  const addQ = () => setQuestions(qs => [...qs, blank()]);
  const rmQ = (i) => setQuestions(qs => qs.length === 1 ? qs : qs.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setSaving(true);
    try {
      const body = { title, description, questions: questions.map(q => ({ ...q, time_limit: Number(q.time_limit) || 30 })) };
      if (editing) await api(`/quizzes/${quizId}`, { method: 'PATCH', token, body });
      else await api('/quizzes/', { method: 'POST', token, body });
      nav('/dashboard');
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="editor">
      <h2>{editing ? 'Edit quiz' : 'New quiz'}</h2>
      <label>Title<input required value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>Description<textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} /></label>

      <div className="q-list">
        {questions.map((q, i) => (
          <div className="q-card" key={i}>
            <div className="q-head">
              <h3>Question {i + 1}</h3>
              {questions.length > 1 && <button type="button" className="btn ghost sm" onClick={() => rmQ(i)}>Remove</button>}
            </div>
            <label>Question<input required value={q.question} onChange={e => updateQ(i, { question: e.target.value })} /></label>
            <label>Time limit (s)<input type="number" min={5} max={300} value={q.time_limit} onChange={e => updateQ(i, { time_limit: e.target.value })} /></label>
            <div className="opts">
              <span className="muted">Options (mark the correct one)</span>
              {q.options.map((opt, j) => (
                <div className="opt-row" key={j}>
                  <input type="radio" name={`correct-${i}`} checked={q.correct_answer === opt && opt !== ''} onChange={() => updateQ(i, { correct_answer: opt })} />
                  <input required value={opt} onChange={e => {
                    const prev = q.options[j];
                    updateOpt(i, j, e.target.value);
                    if (q.correct_answer === prev) updateQ(i, { correct_answer: e.target.value });
                  }} placeholder={`Option ${j + 1}`} />
                  {q.options.length > 2 && <button type="button" className="btn ghost sm" onClick={() => rmOpt(i, j)}>×</button>}
                </div>
              ))}
              <button type="button" className="btn ghost sm" onClick={() => addOpt(i)}>+ Add option</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={addQ}>+ Add question</button>
      </div>

      {err && <div className="error">{err}</div>}
      <div className="actions">
        <button type="button" className="btn ghost" onClick={() => nav(-1)}>Cancel</button>
        <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Update quiz' : 'Create quiz')}</button>
      </div>
    </form>
  );
}
