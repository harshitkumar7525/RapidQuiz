import { useEffect, useState } from "react";
import { api, type Question, type Quiz } from "../lib/api";
import { Styles } from "../routes/login";

export interface QuizDraft {
  title: string;
  description: string;
  questions: Question[];
}

function emptyQuestion(): Question {
  return { question: "", options: ["", ""], correct_answer: "", time_limit: 30 };
}

export function QuizEditor({
  quizId,
  onSaved,
}: {
  quizId?: string;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(!!quizId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuizDraft>({
    title: "",
    description: "",
    questions: [emptyQuestion()],
  });

  useEffect(() => {
    if (!quizId) return;
    api<Quiz>(`/quizzes/${quizId}`)
      .then((q) =>
        setDraft({
          title: q.title,
          description: q.description || "",
          questions: q.questions?.length ? q.questions : [emptyQuestion()],
        }),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  function update(patch: Partial<QuizDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function updateQ(idx: number, patch: Partial<Question>) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  }
  function addQuestion() {
    setDraft((d) => ({ ...d, questions: [...d.questions, emptyQuestion()] }));
  }
  function removeQuestion(idx: number) {
    setDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== idx) }));
  }
  function addOption(qi: number) {
    updateQ(qi, { options: [...draft.questions[qi].options, ""] });
  }
  function setOption(qi: number, oi: number, val: string) {
    const opts = draft.questions[qi].options.map((o, i) => (i === oi ? val : o));
    updateQ(qi, { options: opts });
  }
  function removeOption(qi: number, oi: number) {
    const opts = draft.questions[qi].options.filter((_, i) => i !== oi);
    updateQ(qi, { options: opts });
  }

  async function save() {
    setError(null);
    if (!draft.title.trim()) return setError("Title is required");
    for (const [i, q] of draft.questions.entries()) {
      if (!q.question.trim()) return setError(`Question ${i + 1} text is required`);
      if (q.options.length < 2) return setError(`Question ${i + 1} needs at least 2 options`);
      if (q.options.some((o) => !o.trim())) return setError(`Question ${i + 1} has empty options`);
      if (!q.options.includes(q.correct_answer)) return setError(`Question ${i + 1}: correct answer must match an option`);
    }
    setSaving(true);
    try {
      if (quizId) {
        await api(`/quizzes/${quizId}`, { method: "PATCH", auth: true, body: draft });
      } else {
        await api(`/quizzes/`, { method: "POST", auth: true, body: draft });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input className="input mt-1" value={draft.title} onChange={(e) => update({ title: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea className="input mt-1" rows={2} value={draft.description} onChange={(e) => update({ description: e.target.value })} />
        </label>
      </div>

      {draft.questions.map((q, qi) => (
        <div key={qi} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Question {qi + 1}</h3>
            {draft.questions.length > 1 && (
              <button onClick={() => removeQuestion(qi)} className="btn-ghost text-destructive text-sm">Remove</button>
            )}
          </div>
          <input
            className="input"
            placeholder="Question text"
            value={q.question}
            onChange={(e) => updateQ(qi, { question: e.target.value })}
          />
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex gap-2 items-center">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correct_answer === opt && opt !== ""}
                  onChange={() => updateQ(qi, { correct_answer: opt })}
                  title="Mark as correct"
                />
                <input
                  className="input flex-1"
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setOption(qi, oi, newVal);
                    if (q.correct_answer === opt) updateQ(qi, { correct_answer: newVal });
                  }}
                />
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(qi, oi)} className="btn-ghost text-destructive">×</button>
                )}
              </div>
            ))}
            <button onClick={() => addOption(qi)} className="btn-ghost text-accent text-sm">+ Add option</button>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Time limit (seconds)</span>
            <input
              type="number"
              min={5}
              max={300}
              className="input mt-1 w-32"
              value={q.time_limit ?? 30}
              onChange={(e) => updateQ(qi, { time_limit: parseInt(e.target.value) || 30 })}
            />
          </label>
        </div>
      ))}

      <button onClick={addQuestion} className="btn-secondary">+ Add question</button>

      {error && <div className="text-destructive text-sm">{error}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : quizId ? "Save changes" : "Create quiz"}
        </button>
      </div>
      <Styles />
    </div>
  );
}
