import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Exam, Question } from "../types";
import { Button, Card, ErrorBanner, Spinner, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

const emptyQuestion = () => ({
  text: "",
  imageUrl: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  marks: 4,
  negativeMarks: 1,
  chapter: "",
  topic: "",
  difficulty: "medium" as const,
  explanation: "",
  explanationImageUrl: "",
});

const fieldClass =
  "w-full rounded-xl px-3 py-2 text-sm bg-white text-ink mt-1 border border-ink/10 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export default function ExamEditor() {
  const { examId } = useParams();
  const isNew = !examId || examId === "new";
  const navigate = useNavigate();

  const [exam, setExam] = useState<Partial<Exam>>({
    title: "",
    subject: "NEET",
    durationMinutes: 60,
    instructions:
      "Each correct answer awards positive marks; each wrong answer attracts negative marking. There is no penalty for unattempted questions.",
    defaultMarks: 4,
    defaultNegativeMarks: 1,
    passingMarks: 0,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [savedExamId, setSavedExamId] = useState<string | null>(isNew ? null : examId!);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>(emptyQuestion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"question" | "explanation" | null>(null);
  const questionFileRef = useRef<HTMLInputElement>(null);
  const explanationFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    api
      .get<{ exam: Exam }>(`/exams/${examId}/teacher-view`)
      .then((r) => {
        setExam(r.exam);
        setQuestions(r.exam.questions);
      })
      .finally(() => setLoading(false));
  }, [examId, isNew]);

  async function saveExamMeta() {
    setError("");
    if (!exam.title?.trim()) {
      setError("Please give the exam a title.");
      return;
    }
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

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "imageUrl" | "explanationImageUrl"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field === "imageUrl" ? "question" : "explanation");
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post<{ url: string }>("/upload/image", fd);
      setForm((f: any) => ({ ...f, [field]: res.url }));
    } catch (err: any) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploading(null);
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
    if (!savedExamId) {
      setError("Save the exam details first, then add questions.");
      return;
    }
    if (!form.text.trim() || form.options.some((o: string) => !o.trim())) {
      setError("Please fill the question text and all four options.");
      return;
    }
    setError("");
    try {
      if (editingId) {
        const res = await api.patch<{ question: Question }>(
          `/exams/${savedExamId}/questions/${editingId}`,
          form
        );
        setQuestions((qs) => qs.map((q) => (q._id === editingId ? res.question : q)));
        setEditingId(null);
      } else {
        const res = await api.post<{ question: Question }>(
          `/exams/${savedExamId}/questions`,
          form
        );
        setQuestions((qs) => [...qs, res.question]);
      }
      setForm(emptyQuestion());
      if (questionFileRef.current) questionFileRef.current.value = "";
      if (explanationFileRef.current) explanationFileRef.current.value = "";
    } catch (e: any) {
      setError(e.message || "Couldn't save the question.");
    }
  }

  function editQuestion(q: Question) {
    setForm({
      ...emptyQuestion(),
      ...q,
      imageUrl: q.imageUrl || "",
      explanationImageUrl: q.explanationImageUrl || "",
    });
    setEditingId(q._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteQuestion(id: string) {
    if (!savedExamId) return;
    await api.del(`/exams/${savedExamId}/questions/${id}`);
    setQuestions((qs) => qs.filter((q) => q._id !== id));
  }

  if (loading) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center">
        <Spinner />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>

      <div className="mx-auto max-w-6xl animate-fade-up px-6 py-8 pr-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {isNew ? "Create Exam" : "Edit Exam"}
            </h1>
            <p className="text-sm text-bronze">Add question and solution images as needed</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/teacher")}>
            ← Back to dashboard
          </Button>
        </div>

        <ErrorBanner message={error} />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="h-fit p-6 lg:col-span-1 animate-fade-up">
            <div className="mb-4 font-semibold text-ink">Exam details</div>
            <label className="text-xs font-semibold text-bronze">Title</label>
            <input
              value={exam.title}
              onChange={(e) => setExam((x) => ({ ...x, title: e.target.value }))}
              className={`${fieldClass} mb-3`}
            />

            <label className="text-xs font-semibold text-bronze">Subject</label>
            <select
              value={exam.subject}
              onChange={(e) => setExam((x) => ({ ...x, subject: e.target.value }))}
              className={`${fieldClass} mb-3`}
            >
              <option>NEET</option>
              <option>JEE Main</option>
              <option>JEE Advanced</option>
            </select>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-bronze">Duration (min)</label>
                <input
                  type="number"
                  value={exam.durationMinutes}
                  onChange={(e) =>
                    setExam((x) => ({ ...x, durationMinutes: Number(e.target.value) }))
                  }
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-bronze">+ Marks</label>
                <input
                  type="number"
                  value={exam.defaultMarks}
                  onChange={(e) =>
                    setExam((x) => ({ ...x, defaultMarks: Number(e.target.value) }))
                  }
                  className={fieldClass}
                />
              </div>
            </div>
            <label className="text-xs font-semibold text-bronze">&minus; Negative marks</label>
            <input
              type="number"
              value={exam.defaultNegativeMarks}
              onChange={(e) =>
                setExam((x) => ({ ...x, defaultNegativeMarks: Number(e.target.value) }))
              }
              className={`${fieldClass} mb-3`}
            />

            <label className="text-xs font-semibold text-bronze">Passing marks</label>
            <input
              type="number"
              value={exam.passingMarks}
              onChange={(e) => setExam((x) => ({ ...x, passingMarks: Number(e.target.value) }))}
              className={`${fieldClass} mb-3`}
            />

            <label className="text-xs font-semibold text-bronze">Instructions</label>
            <textarea
              rows={4}
              value={exam.instructions}
              onChange={(e) => setExam((x) => ({ ...x, instructions: e.target.value }))}
              className={`${fieldClass} mb-4`}
            />

            <Button className="w-full" onClick={saveExamMeta} disabled={saving}>
              {saving ? "Saving…" : "Save Exam Details"}
            </Button>

            {savedExamId && (
              <div className="mt-3 text-xs text-bronze">{questions.length} question(s) added</div>
            )}
          </Card>

          <div className="space-y-5 lg:col-span-2">
            {!savedExamId && (
              <Card className="border-orange-200 bg-orange-50 p-5 text-sm text-orange-700">
                Save the exam details on the left first — then you can start adding questions here.
              </Card>
            )}

            <Card className="animate-fade-up p-6" style={{ animationDelay: "0.08s" } as React.CSSProperties}>
              <div className="mb-1 font-semibold text-ink">
                {editingId ? "Editing question" : "Add a question"}
              </div>
              <div className="mb-4 text-xs text-bronze">
                Question image appears above the options. Solution image appears with the explanation.
              </div>

              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-bronze">
                Question image
              </div>
              <label className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-soft/60 py-6">
                {uploading === "question" ? (
                  <span className="text-xs text-bronze">Uploading…</span>
                ) : form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="max-h-40 rounded-lg" />
                ) : (
                  <span className="text-xs text-bronze">Click to upload question image (optional)</span>
                )}
                <input
                  ref={questionFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "imageUrl")}
                  className="hidden"
                />
              </label>
              {form.imageUrl && (
                <button
                  type="button"
                  className="mb-4 text-xs font-semibold text-ember"
                  onClick={() => setForm((f: any) => ({ ...f, imageUrl: "" }))}
                >
                  Remove question image
                </button>
              )}

              <textarea
                rows={3}
                placeholder="Type the question here…"
                value={form.text}
                onChange={(e) => setForm((f: any) => ({ ...f, text: e.target.value }))}
                className={`${fieldClass} mb-4`}
              />

              <div className="mb-4 space-y-2">
                {form.options.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      onClick={() => setForm((f: any) => ({ ...f, correctOptionIndex: i }))}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        form.correctOptionIndex === i
                          ? "bg-emerald-600 text-white"
                          : "border border-ink/10 bg-soft text-bronze"
                      }`}
                    >
                      {"ABCD"[i]}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${"ABCD"[i]}`}
                      className={`flex-1 rounded-xl border bg-white px-3 py-2 text-sm ${
                        form.correctOptionIndex === i ? "border-emerald-500" : "border-ink/10"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3">
                <input
                  placeholder="Chapter"
                  value={form.chapter}
                  onChange={(e) => setForm((f: any) => ({ ...f, chapter: e.target.value }))}
                  className={fieldClass}
                />
                <input
                  placeholder="Topic"
                  value={form.topic}
                  onChange={(e) => setForm((f: any) => ({ ...f, topic: e.target.value }))}
                  className={fieldClass}
                />
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((f: any) => ({ ...f, difficulty: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-bronze">
                Solution / explanation
              </div>
              <textarea
                rows={2}
                placeholder="Explanation shown in solutions (optional)"
                value={form.explanation}
                onChange={(e) => setForm((f: any) => ({ ...f, explanation: e.target.value }))}
                className={`${fieldClass} mb-3`}
              />

              <label className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/40 bg-champagne/40 py-6">
                {uploading === "explanation" ? (
                  <span className="text-xs text-bronze">Uploading solution image…</span>
                ) : form.explanationImageUrl ? (
                  <img src={form.explanationImageUrl} alt="" className="max-h-40 rounded-lg" />
                ) : (
                  <span className="text-xs text-bronze">
                    Click to upload solution / explanation image (optional)
                  </span>
                )}
                <input
                  ref={explanationFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "explanationImageUrl")}
                  className="hidden"
                />
              </label>
              {form.explanationImageUrl && (
                <button
                  type="button"
                  className="mb-4 text-xs font-semibold text-ember"
                  onClick={() => setForm((f: any) => ({ ...f, explanationImageUrl: "" }))}
                >
                  Remove solution image
                </button>
              )}

              <div className="flex gap-2">
                <Button variant="accent" onClick={addOrUpdateQuestion}>
                  {editingId ? "Update Question" : "Add Question"}
                </Button>
                {editingId && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm(emptyQuestion());
                      setEditingId(null);
                    }}
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </Card>

            {questions.length > 0 && (
              <Card className="animate-fade-up p-6" style={{ animationDelay: "0.12s" } as React.CSSProperties}>
                <div className="mb-4 font-semibold text-ink">Question bank ({questions.length})</div>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div
                      key={q._id}
                      className="flex items-start justify-between gap-3 rounded-xl bg-soft/80 p-3"
                    >
                      <div className="flex min-w-0 gap-3">
                        {q.imageUrl && (
                          <img
                            src={q.imageUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="mb-0.5 font-mono text-xs text-orange-600">Q{i + 1}</div>
                          <div className="max-w-sm truncate text-sm text-ink">{q.text}</div>
                          {q.explanationImageUrl && (
                            <div className="mt-1 text-[11px] text-bronze">Has solution image</div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => editQuestion(q)}
                          className="rounded-full border border-ink/15 bg-white p-2 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(q._id)}
                          className="rounded-full bg-red-50 p-2 text-xs text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
