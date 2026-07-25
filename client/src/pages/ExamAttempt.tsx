import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { Exam, AnswerEntry } from "../types";
import { Button, Card, Spinner } from "../components/ui";
import { useTimer, formatTime } from "../hooks/useTimer";
import { useAntiCheat, requestFullscreen } from "../hooks/useAntiCheat";

export default function ExamAttempt() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { startedAt?: string } };

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({});
  const [qIndex, setQIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittedRef = useRef(false);

  // useEffect(() => {
  //   api.get<{ exam: Exam }>(`/exams/${examId}/student-view`).then((r) => setExam(r.exam)).finally(() => setLoading(false));
  //   if (exam?.antiCheat?.requireFullscreen) requestFullscreen();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [examId]);
  useEffect(() => {
  api.get<{ exam: Exam }>(`/exams/${examId}/student-view`)
    .then((r) => setExam(r.exam))
    .finally(() => setLoading(false));
}, [examId]);

useEffect(() => {
  if (exam?.antiCheat?.requireFullscreen) {
    requestFullscreen();
  }
}, [exam]);
  // NOTE / TODO: remaining time is computed from the startedAt timestamp passed via
  // navigation state (set right after /attempts/:examId/start). If the student
  // refreshes this page, that state is lost and this falls back to the full
  // duration — a dedicated "GET /attempts/:id" resume endpoint would fix that;
  // not built yet.
  // const initialSeconds = useMemo(() => {
  //   if (!exam) return 0;
  //   if (location.state?.startedAt) {
  //     const elapsed = Math.floor((Date.now() - new Date(location.state.startedAt).getTime()) / 1000);
  //     return Math.max(0, exam.durationMinutes * 60 - elapsed);
  //   }
  //   return exam.durationMinutes * 60;
  // }, [exam, location.state]);
const initialSeconds = useMemo(() => {
  if (!exam) return null;

  // If this is a fresh attempt, simply use the exam duration.
  if (!location.state?.startedAt) {
    return exam.durationMinutes * 60;
  }

  const started = new Date(location.state.startedAt).getTime();

  // Invalid date? Fall back to full duration.
  if (Number.isNaN(started)) {
    return exam.durationMinutes * 60;
  }

  const elapsed = Math.floor((Date.now() - started) / 1000);
  const remaining = exam.durationMinutes * 60 - elapsed;

  return remaining > 0 ? remaining : 0;
}, [exam, location.state]);

const submitExam = useCallback(async (auto = false) => {
  console.log("submitExam called", { auto });
    console.log("===== submitExam CALLED =====");
  console.trace();
  if (submittedRef.current) return;

  submittedRef.current = true;

  try {
    await api.post(`/attempts/${attemptId}/submit`, { auto });
  } finally {
    console.log("Navigating to result page");
    navigate(`/student/result/${attemptId}`);
  }
}, [attemptId, navigate]);

  //const timeLeft = useTimer(initialSeconds, () => submitExam(true));
  console.log({
  examLoaded: !!exam,
  initialSeconds,
  duration: exam?.durationMinutes,
  startedAt: location.state?.startedAt,
});
  // const timeLeft = useTimer(
  // exam ? initialSeconds : null,
  // () => submitExam(true)
  // );
  //const timeLeft = 999999;

  const timeLeft = useTimer(initialSeconds, () => submitExam(true));
  useAntiCheat(!!exam, (type) => {
    api.post(`/attempts/${attemptId}/violation`, { type }).catch(() => {});
  });

  const q = exam?.questions[qIndex];

  function persistAnswer(questionId: string, patch: Partial<AnswerEntry>) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: { ...prev[questionId], ...patch } };
      api.post(`/attempts/${attemptId}/answer`, { questionId, ...patch }).catch(() => {});
      return next;
    });
  }

  useEffect(() => {
    if (q) persistAnswer(q._id, { visited: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  if (loading || !exam) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!q) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">This exam has no questions.</div>;

  const total = exam.questions.length;
  const low = timeLeft <= 300;
  const answeredCount = Object.values(answers).filter((a) => a.selected !== undefined && a.selected !== null).length;

  function statusFor(i: number) {
    const qq = exam!.questions[i];
    const entry = answers[qq._id];
    const answered = entry?.selected !== undefined && entry?.selected !== null;
    if (entry?.markedForReview && answered) return "flagged-answered";
    if (entry?.markedForReview) return "flagged";
    if (answered) return "answered";
    if (entry?.visited) return "seen";
    return "new";
  }
  const statusClasses: Record<string, string> = {
    "flagged-answered": "bg-purple-600 text-white ring-2 ring-green-500",
    flagged: "bg-purple-600 text-white",
    answered: "bg-green-600 text-white",
    seen: "bg-red-50 text-red-600 border border-red-400",
    new: "bg-white text-gray-600 border border-gray-300",
  };

  const currentEntry = answers[q._id];

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex items-center justify-between px-6 py-4 bg-ink text-paper">
        <div>
          <div className="font-bold">{exam.title}</div>
          <div className="text-xs text-gray-300">Question {qIndex + 1} of {total}</div>
        </div>
        <div className={`font-mono flex items-center gap-2 rounded-full px-4 py-2 font-bold text-lg ${low ? "bg-red-500 text-white" : "bg-marigold text-ink"}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 px-6 py-6 max-w-6xl mx-auto">
        <Card className="p-6">
          <div className="text-base font-medium mb-4 text-ink">{q.text}</div>
          {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-72 rounded-xl mb-5 border border-gray-200" />}

          <div className="space-y-3">
            {q.options.map((opt, oi) => (
              <button key={oi} onClick={() => persistAnswer(q._id, { selected: oi })}
                className={`w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 border ${currentEntry?.selected === oi ? "border-ink bg-gray-100" : "border-gray-300 bg-white"}`}>
                <span className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold ${currentEntry?.selected === oi ? "bg-ink text-white" : "bg-gray-100 text-gray-600"}`}>
                  {"ABCD"[oi]}
                </span>
                <span className="text-sm text-ink">{opt}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="ghost" onClick={() => setQIndex((i) => Math.max(0, i - 1))} disabled={qIndex === 0}>Previous</Button>
            <Button variant="ghost" onClick={() => persistAnswer(q._id, { selected: null as any })}>Clear Response</Button>
            <Button variant="ghost" onClick={() => persistAnswer(q._id, { markedForReview: !currentEntry?.markedForReview })}>
              {currentEntry?.markedForReview ? "Unmark review" : "Mark for review"}
            </Button>
            <div className="flex-1" />
            {qIndex < total - 1 ? (
              <Button onClick={() => setQIndex((i) => i + 1)}>Save &amp; Next</Button>
            ) : (
              <Button variant="accent" onClick={() => setConfirmOpen(true)}>Submit Test</Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-semibold text-sm text-ink mb-3">Question Palette</div>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((qq, i) => (
                <button key={qq._id} onClick={() => setQIndex(i)} className={`rounded-lg h-9 text-xs font-bold ${statusClasses[statusFor(i)]}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5 text-center">
            <div className="text-xs text-gray-500">Answered</div>
            <div className="text-2xl font-bold text-ink">{answeredCount}/{total}</div>
          </Card>
          <Button variant="accent" className="w-full" onClick={() => setConfirmOpen(true)}>Submit Test</Button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center px-6 z-50 bg-black/50">
          <Card className="p-7 w-full max-w-sm">
            <div className="font-bold text-lg text-ink mb-2">Submit the test?</div>
            <div className="text-sm text-gray-500 mb-5">
              You've answered {answeredCount} of {total} questions. This can't be undone.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmOpen(false)}>Keep working</Button>
              <Button className="flex-1" onClick={() => submitExam(false)}>Submit</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
