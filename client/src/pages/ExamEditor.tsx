import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Exam, Question } from "../types";
import { Button, Card, ErrorBanner, Spinner } from "../components/ui";

const emptyQuestion = () => ({
  text: "", imageUrl: "", options: ["", "", "", ""], correctOptionIndex: 0,
  marks: 4, negativeMarks: 1, chapter: "", topic: "", difficulty: "medium" as const, explanation: "",
});

export default function ExamEditor() {
  const { examId } = useParams();
  const isNew = !examId || examId === "new";
  const navigate = useNavigate();

  const [exam, setExam] = useState<Partial<Exam>>({
    title: "", subject: "NEET", durationMinutes: 60, instructions:
      "Each correct answer awards positive marks; each wrong answer attracts negative marking. There is no penalty for unattempted questions.",
    defaultMarks: 4, defaultNegativeMarks: 1, passingMarks: 0,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [savedExamId, setSavedExamId] = useState<string | null>(isNew ? null : examId!);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>(emptyQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    api.get<{ exam: Exam }>(`/exams/${examId}/teacher-view`)
      .then((r) => { setExam(r.exam); setQuestions(r.exam.questions); })
      .finally(() => setLoading(false));
  }, [examId, isNew]);

  async function saveExamMeta() {
    setError("");
    if (!exam.title?.trim()) { setError("Please give the exam a title."); return; }
    setSaving(true);
    try {
      if (!savedExamId) {
        const res = await api.post<{ exam: Exam }>("/exams", exam);
        setSavedExamId(res.exam._id);
        navigate(`/teacher/exam/${res.exam._id}/edit`, { replace: true });
      } else {
        await api.patch(`/exams/${savedExamId}`, exam);
      }
    } catch (e: any) {
      setError(e.message || "Couldn't save the exam.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post<{ url: string }>("/upload/image", fd);
      setForm((f: any) => ({ ...f, imageUrl: res.url }));
    } catch (err: any) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function updateOption(i: number, val: string) {
    setForm((f: any) => {
      const opts = [...f.options];
      opts[i] = val;
      return { ...f, options: opts };
    });
  }

  async function addOrUpdateQuestion() {
    if (!savedExamId) { setError("Save the exam details first, then add questions."); return; }
    if (!form.text.trim() || form.options.some((o: string) => !o.trim())) {
      setError("Please fill the question text and all four options.");
      return;
    }
    setError("");
    try {
      if (editingId) {
        const res = await api.patch<{ question: Question }>(`/exams/${savedExamId}/questions/${editingId}`, form);
        setQuestions((qs) => qs.map((q) => (q._id === editingId ? res.question : q)));
        setEditingId(null);
      } else {
        const res = await api.post<{ question: Question }>(`/exams/${savedExamId}/questions`, form);
        setQuestions((qs) => [...qs, res.question]);
      }
      setForm(emptyQuestion());
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setError(e.message || "Couldn't save the question.");
    }
  }

  function editQuestion(q: Question) {
    setForm({ ...q });
    setEditingId(q._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteQuestion(id: string) {
    if (!savedExamId) return;
    await api.del(`/exams/${savedExamId}/questions/${id}`);
    setQuestions((qs) => qs.filter((q) => q._id !== id));
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-paper px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-champagne">{isNew ? "Create Exam" : "Edit Exam"}</h1>
          <p className="text-sm text-bronze">Question images sit right above the options</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/teacher")}>← Back to dashboard</Button>
      </div>

      <ErrorBanner message={error} />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 h-fit">
          <div className="font-semibold text-champagne mb-4">Exam details</div>
          <label className="text-xs font-semibold text-bronze">Title</label>
          <input value={exam.title} onChange={(e) => setExam((x) => ({ ...x, title: e.target.value }))}
            className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 mb-3 border border-gold/25" />

          <label className="text-xs font-semibold text-bronze">Subject</label>
          <select value={exam.subject} onChange={(e) => setExam((x) => ({ ...x, subject: e.target.value }))}
            className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 mb-3 border border-gold/25">
            <option>NEET</option><option>JEE Main</option><option>JEE Advanced</option>
          </select>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-bronze">Duration (min)</label>
              <input type="number" value={exam.durationMinutes} onChange={(e) => setExam((x) => ({ ...x, durationMinutes: Number(e.target.value) }))}
                className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 border border-gold/25" />
            </div>
            <div>
              <label className="text-xs font-semibold text-bronze">+ Marks</label>
              <input type="number" value={exam.defaultMarks} onChange={(e) => setExam((x) => ({ ...x, defaultMarks: Number(e.target.value) }))}
                className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 border border-gold/25" />
            </div>
          </div>
          <label className="text-xs font-semibold text-bronze">&minus; Negative marks</label>
          <input type="number" value={exam.defaultNegativeMarks} onChange={(e) => setExam((x) => ({ ...x, defaultNegativeMarks: Number(e.target.value) }))}
            className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 mb-3 border border-gold/25" />

          <label className="text-xs font-semibold text-bronze">Passing marks</label>
          <input type="number" value={exam.passingMarks} onChange={(e) => setExam((x) => ({ ...x, passingMarks: Number(e.target.value) }))}
            className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 mb-3 border border-gold/25" />

          <label className="text-xs font-semibold text-bronze">Instructions</label>
          <textarea rows={4} value={exam.instructions} onChange={(e) => setExam((x) => ({ ...x, instructions: e.target.value }))}
            className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mt-1 mb-4 border border-gold/25" />

          <Button className="w-full" onClick={saveExamMeta} disabled={saving}>{saving ? "Saving…" : "Save Exam Details"}</Button>

          {savedExamId && <div className="text-xs text-bronze/70 mt-3">{questions.length} question(s) added</div>}
        </Card>

        <div className="lg:col-span-2 space-y-5">
          {!savedExamId && (
            <Card className="p-5 bg-orange-50 border-orange-200 text-sm text-orange-700">
              Save the exam details on the left first — then you can start adding questions here.
            </Card>
          )}

          <Card className="p-6">
            <div className="font-semibold text-champagne mb-1">{editingId ? "Editing question" : "Add a question"}</div>
            <div className="text-xs text-bronze mb-4">Upload a diagram or figure — it appears above the four options.</div>

            <label className="rounded-xl flex flex-col items-center justify-center gap-2 py-6 mb-4 cursor-pointer border-2 border-dashed border-gold/25 bg-ink/60">
              {uploading ? (
                <span className="text-xs text-bronze">Uploading…</span>
              ) : form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="max-h-40 rounded-lg" />
              ) : (
                <span className="text-xs text-bronze">Click to upload question image (optional)</span>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <textarea rows={3} placeholder="Type the question here…" value={form.text}
              onChange={(e) => setForm((f: any) => ({ ...f, text: e.target.value }))}
              className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mb-4 border border-gold/25" />

            <div className="space-y-2 mb-4">
              {form.options.map((opt: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setForm((f: any) => ({ ...f, correctOptionIndex: i }))}
                    className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0 ${form.correctOptionIndex === i ? "bg-green-600 text-white" : "bg-ink border border-gold/20 text-bronze"}`}>
                    {"ABCD"[i]}
                  </button>
                  <input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${"ABCD"[i]}`}
                    className={`flex-1 rounded-sm px-3 py-2 text-sm bg-charcoal text-mist border ${form.correctOptionIndex === i ? "border-green-500" : "border-gold/25"}`} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <input placeholder="Chapter" value={form.chapter} onChange={(e) => setForm((f: any) => ({ ...f, chapter: e.target.value }))}
                className="rounded-sm px-3 py-2 text-sm bg-charcoal text-mist border border-gold/25" />
              <input placeholder="Topic" value={form.topic} onChange={(e) => setForm((f: any) => ({ ...f, topic: e.target.value }))}
                className="rounded-sm px-3 py-2 text-sm bg-charcoal text-mist border border-gold/25" />
              <select value={form.difficulty} onChange={(e) => setForm((f: any) => ({ ...f, difficulty: e.target.value }))}
                className="rounded-sm px-3 py-2 text-sm bg-charcoal text-mist border border-gold/25">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>

            <textarea rows={2} placeholder="Explanation shown in solutions (optional)" value={form.explanation}
              onChange={(e) => setForm((f: any) => ({ ...f, explanation: e.target.value }))}
              className="w-full rounded-sm px-3 py-2 text-sm bg-charcoal text-mist mb-4 border border-gold/25" />

            <div className="flex gap-2">
              <Button variant="accent" onClick={addOrUpdateQuestion}>{editingId ? "Update Question" : "Add Question"}</Button>
              {editingId && <Button variant="ghost" onClick={() => { setForm(emptyQuestion()); setEditingId(null); }}>Cancel edit</Button>}
            </div>
          </Card>

          {questions.length > 0 && (
            <Card className="p-6">
              <div className="font-semibold text-champagne mb-4">Question bank ({questions.length})</div>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q._id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-ink/60">
                    <div className="flex gap-3 min-w-0">
                      {q.imageUrl && <img src={q.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-xs text-orange-600 font-mono mb-0.5">Q{i + 1}</div>
                        <div className="text-sm text-champagne truncate max-w-sm">{q.text}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => editQuestion(q)} className="rounded-full p-2 bg-charcoal border border-gold/25 text-xs">Edit</button>
                      <button onClick={() => deleteQuestion(q._id)} className="rounded-full p-2 bg-red-50 text-red-600 text-xs">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
