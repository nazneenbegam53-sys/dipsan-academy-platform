import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Exam, Question } from "../types";
import { AppHeader, Badge, Button, Card, PageShell, Spinner } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { SupportButton } from "../components/SupportButton";
import { VideoSolutionRecorder } from "../components/VideoSolutionRecorder";

function formatDuration(sec?: number | null) {
  if (!sec && sec !== 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function statusTone(status?: Question["explanationVideoStatus"]) {
  if (status === "published") return "success" as const;
  if (status === "draft") return "marigold" as const;
  return "ink" as const;
}

export default function VideoSolutions() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!examId) return;
    setLoading(true);
    api
      .get<{ exam: Exam }>(`/exams/${examId}/teacher-view`)
      .then((res) => {
        setExam(res.exam);
        const qs = res.exam.questions || [];
        setActiveId((prev) => prev || qs[0]?._id || null);
      })
      .catch((err) => setError(err.message || "Failed to load exam."))
      .finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    load();
  }, [load]);

  const questions = exam?.questions || [];
  const active = useMemo(
    () => questions.find((q) => q._id === activeId) || null,
    [questions, activeId]
  );

  const stats = useMemo(() => {
    const published = questions.filter((q) => q.explanationVideoStatus === "published").length;
    const draft = questions.filter((q) => q.explanationVideoStatus === "draft").length;
    const none = questions.length - published - draft;
    return { published, draft, none, total: questions.length };
  }, [questions]);

  async function uploadAndSave(blob: Blob, durationSeconds: number) {
    if (!examId || !active) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      // Browsers/WebViews often send Blobs as application/octet-stream — force a real video File type.
      const baseMime = (blob.type || "").split(";")[0].trim().toLowerCase();
      const isMp4 = baseMime.includes("mp4") || baseMime.includes("quicktime");
      const ext = isMp4 ? "mp4" : "webm";
      const mime = baseMime.startsWith("video/") ? baseMime : isMp4 ? "video/mp4" : "video/webm";
      const file = new File([blob], `q-${active._id}.${ext}`, { type: mime });
      fd.append("video", file);
      const uploaded = await api.post<{ url: string; provider?: string; duration?: number | null }>(
        "/upload/video",
        fd
      );
      const { question } = await api.patch<{ question: Question }>(
        `/exams/${examId}/questions/${active._id}/video-solution`,
        {
          url: uploaded.url,
          provider: uploaded.provider || null,
          duration: uploaded.duration ?? durationSeconds,
          status: "draft",
        }
      );
      setExam((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q._id === question._id ? { ...q, ...question } : q)),
        };
      });
      setMessage("Recording saved as draft. Publish when ready for students.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "draft" | "published") {
    if (!examId || !active?.explanationVideoUrl) return;
    setBusy(true);
    setError("");
    try {
      const { question } = await api.patch<{ question: Question }>(
        `/exams/${examId}/questions/${active._id}/video-solution`,
        { status }
      );
      setExam((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q._id === question._id ? { ...q, ...question } : q)),
        };
      });
      setMessage(
        status === "published"
          ? "Video published — students can watch it on their result page."
          : "Video unpublished — students can no longer see it."
      );
    } catch (err: any) {
      setError(err.message || "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  async function clearVideo() {
    if (!examId || !active) return;
    if (!window.confirm("Delete this video solution?")) return;
    setBusy(true);
    try {
      const { question } = await api.patch<{ question: Question }>(
        `/exams/${examId}/questions/${active._id}/video-solution`,
        { clear: true }
      );
      setExam((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) => (q._id === question._id ? { ...q, ...question } : q)),
        };
      });
      setMessage("Video removed.");
    } catch (err: any) {
      setError(err.message || "Could not delete video.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <div className="fixed right-2 top-2 z-[80] flex flex-nowrap items-center gap-2 sm:right-5 sm:top-5 md:right-8 md:top-6">
        <NotificationBell />
        <SupportButton />
        <BrandLogo size="sm" glow spinRing />
      </div>

      <div className="mx-auto max-w-6xl animate-fade-up px-6 py-10 pr-20">
        <AppHeader
          title="Video solutions"
          subtitle={
            exam
              ? `${exam.title} · record · save · publish per question`
              : "Question-wise interactive explanations"
          }
          actions={
            <>
              <Button variant="ghost" onClick={() => navigate("/teacher")}>
                Dashboard
              </Button>
              {examId && (
                <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${examId}/edit`)}>
                  Edit exam
                </Button>
              )}
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
            </>
          }
        />

        {loading ? (
          <Spinner />
        ) : error && !exam ? (
          <p className="text-sm text-ember">{error}</p>
        ) : !exam ? (
          <p className="text-sm text-bronze">Exam not found.</p>
        ) : questions.length === 0 ? (
          <Card>
            <p className="text-sm text-bronze">
              Add questions in the exam editor first, then come back to record video solutions.
            </p>
            <Button className="mt-4" onClick={() => navigate(`/teacher/exam/${exam._id}/edit`)}>
              Open exam editor
            </Button>
          </Card>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 border-y border-gold/15 py-6 sm:grid-cols-4">
              {[
                { label: "Questions", value: stats.total },
                { label: "Published", value: stats.published },
                { label: "Draft", value: stats.draft },
                { label: "Missing", value: stats.none },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-bronze">
                    {s.label}
                  </div>
                  <div className="mt-1 font-display text-2xl font-semibold text-gold">{s.value}</div>
                </div>
              ))}
            </div>

            {(message || error) && (
              <p
                className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                  error
                    ? "border-ember/40 bg-ember/10 text-ember"
                    : "border-aurora/30 bg-aurora/10 text-aurora"
                }`}
              >
                {error || message}
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
              <Card className="!p-0 overflow-hidden">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">
                    Questions
                  </p>
                </div>
                <ul className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
                  {questions.map((q, i) => {
                    const selected = q._id === activeId;
                    return (
                      <li key={q._id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(q._id);
                            setMessage("");
                            setError("");
                          }}
                          className={`flex w-full flex-col gap-2 px-4 py-3 text-left transition ${
                            selected ? "bg-gold/10" : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-champagne">Q{i + 1}</span>
                            <Badge tone={statusTone(q.explanationVideoStatus)}>
                              {q.explanationVideoStatus === "published"
                                ? "Published"
                                : q.explanationVideoStatus === "draft"
                                  ? "Draft"
                                  : "No video"}
                            </Badge>
                          </div>
                          <p className="line-clamp-2 text-sm text-mist">{q.text}</p>
                          {q.explanationVideoDuration != null && q.explanationVideoUrl && (
                            <p className="text-[10px] text-bronze">
                              {formatDuration(q.explanationVideoDuration)}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <div className="space-y-4">
                {active && (
                  <>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                            Question {questions.findIndex((q) => q._id === active._id) + 1}
                          </p>
                          <h2 className="mt-1 font-display text-xl text-mist">{active.text}</h2>
                          {active.chapter && (
                            <p className="mt-1 text-xs text-bronze">
                              {active.chapter}
                              {active.topic ? ` · ${active.topic}` : ""}
                            </p>
                          )}
                        </div>
                        <Badge tone={statusTone(active.explanationVideoStatus)}>
                          {active.explanationVideoStatus === "published"
                            ? "Published"
                            : active.explanationVideoStatus === "draft"
                              ? "Draft"
                              : "No video"}
                        </Badge>
                      </div>

                      {active.imageUrl && (
                        <img
                          src={active.imageUrl}
                          alt="Question figure"
                          className="mt-4 max-h-56 rounded-xl border border-white/10"
                        />
                      )}

                      {active.options && active.options.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">
                            Options
                          </p>
                          <ul className="space-y-2">
                            {active.options.map((opt, oi) => {
                              const isCorrect = oi === active.correctOptionIndex;
                              return (
                                <li
                                  key={oi}
                                  className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                                    isCorrect
                                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                                      : "border-white/15 bg-white/5 text-mist"
                                  }`}
                                >
                                  <span className="font-semibold text-gold">{"ABCD"[oi]}.</span>
                                  <span className="flex-1">{opt || "—"}</span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                                      Correct
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {active.explanationVideoUrl && (
                        <div className="mt-4 space-y-3">
                          <video
                            key={active.explanationVideoUrl}
                            src={active.explanationVideoUrl}
                            controls
                            playsInline
                            className="aspect-video w-full rounded-xl border border-white/10 bg-black"
                          />
                          <div className="flex flex-wrap gap-2">
                            {active.explanationVideoStatus !== "published" ? (
                              <Button
                                type="button"
                                onClick={() => setStatus("published")}
                                disabled={busy}
                              >
                                Publish for students
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStatus("draft")}
                                disabled={busy}
                              >
                                Unpublish
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="danger"
                              onClick={clearVideo}
                              disabled={busy}
                            >
                              Delete video
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>

                    <Card>
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">
                        {active.explanationVideoUrl ? "Re-record solution" : "Record solution"}
                      </p>
                      <VideoSolutionRecorder
                        key={active._id}
                        disabled={busy}
                        onSave={uploadAndSave}
                      />
                    </Card>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
