import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { Exam, AnswerEntry } from "../types";
import { Button, Card, Spinner } from "../components/ui";
import { useTimer, formatTime } from "../hooks/useTimer";
import { useAntiCheat, requestFullscreen, violationLabel, ViolationType } from "../hooks/useAntiCheat";

export default function ExamAttempt() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { startedAt?: string } };

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({});
  const [qIndex, setQIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [violationAlert, setViolationAlert] = useState<{
    type: ViolationType;
    count: number;
  } | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    api
      .get<{ exam: Exam }>(`/exams/${examId}/student-view`)
      .then((r) => setExam(r.exam))
      .finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    if (exam?.antiCheat?.requireFullscreen) {
      requestFullscreen();
    }
  }, [exam]);

  const initialSeconds = useMemo(() => {
    if (!exam) return undefined;

    if (location.state?.startedAt) {
      const elapsed = Math.floor(
        (Date.now() - new Date(location.state.startedAt).getTime()) / 1000
      );
      return Math.max(0, exam.durationMinutes * 60 - elapsed);
    }

    return exam.durationMinutes * 60;
  }, [exam, location.state]);

  const submitExam = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;

      try {
        await api.post(`/attempts/${attemptId}/submit`, { auto });
      } finally {
        navigate(`/student/result/${attemptId}`);
      }
    },
    [attemptId, navigate]
  );

  const timeLeft = useTimer(initialSeconds, () => submitExam(true));

  useAntiCheat(!!exam && !submittedRef.current, (type) => {
    api
      .post<{ violationCount: number; shouldAutoSubmit: boolean }>(
        `/attempts/${attemptId}/violation`,
        { type }
      )
      .then((res) => {
        setViolationCount(res.violationCount);
        setViolationAlert({ type, count: res.violationCount });
        if (res.shouldAutoSubmit) {
          void submitExam(true);
        }
      })
      .catch(() => {
        setViolationCount((c) => {
          const next = c + 1;
          setViolationAlert({ type, count: next });
          return next;
        });
      });
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

  if (loading || !exam)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  if (!q)
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-bronze">
        This exam has no questions.
      </div>
    );

  const total = exam.questions.length;
  const low = timeLeft <= 300;
  const answeredCount = Object.values(answers).filter(
    (a) => a.selected !== undefined && a.selected !== null
  ).length;

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
    seen: "bg-ember/15 text-red-600 border border-red-400",
    new: "bg-charcoal text-bronze border border-white/15",
  };

  const currentEntry = answers[q._id];
  const isTabLeave =
    violationAlert?.type === "visibility-hidden" || violationAlert?.type === "tab-blur";

  return (
    <div
      className="min-h-[100dvh] bg-paper"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex flex-col gap-3 bg-soft px-4 py-3 text-mist sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 border-b border-white/10">
        <div className="min-w-0">
          <div className="truncate font-bold">{exam.title}</div>
          <div className="text-xs text-bronze">
            Question {qIndex + 1} of {total}
            {violationCount > 0 && (
              <span className="ml-2 text-ember">· {violationCount} warning(s)</span>
            )}
          </div>
        </div>
        <div
          className={`font-mono flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 font-bold text-lg ${
            low ? "bg-ember text-white" : "bg-gold/90 text-ink"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 break-anywhere text-base font-medium text-mist">{q.text}</div>
          {q.imageUrl && (
            <img
              src={q.imageUrl}
              alt=""
              className="mb-5 max-h-72 w-full rounded-xl border border-white/10 object-contain"
            />
          )}

          <div className="space-y-3">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => persistAnswer(q._id, { selected: oi })}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left sm:items-center sm:px-4 ${
                  currentEntry?.selected === oi
                    ? "border-gold bg-gold/15"
                    : "border-white/15 bg-charcoal"
                }`}
              >
                <span
                  className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold ${
                    currentEntry?.selected === oi
                      ? "bg-gold/90 text-ink"
                      : "bg-paper border border-white/10 text-bronze"
                  }`}
                >
                  {"ABCD"[oi]}
                </span>
                <span className="min-w-0 break-anywhere text-sm text-mist">{opt}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Button
              variant="ghost"
              onClick={() => setQIndex((i) => Math.max(0, i - 1))}
              disabled={qIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={() => persistAnswer(q._id, { selected: null as any })}
            >
              Clear Response
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                persistAnswer(q._id, { markedForReview: !currentEntry?.markedForReview })
              }
            >
              {currentEntry?.markedForReview ? "Unmark review" : "Mark for review"}
            </Button>
            <div className="flex-1" />
            {qIndex < total - 1 ? (
              <Button onClick={() => setQIndex((i) => i + 1)}>Save &amp; Next</Button>
            ) : (
              <Button variant="accent" onClick={() => setConfirmOpen(true)}>
                Submit Test
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-semibold text-sm text-mist mb-3">Question Palette</div>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((qq, i) => (
                <button
                  key={qq._id}
                  onClick={() => setQIndex(i)}
                  className={`rounded-lg h-9 text-xs font-bold ${statusClasses[statusFor(i)]}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5 text-center">
            <div className="text-xs text-bronze">Answered</div>
            <div className="text-2xl font-bold text-mist">
              {answeredCount}/{total}
            </div>
          </Card>
          <Button variant="accent" className="w-full" onClick={() => setConfirmOpen(true)}>
            Submit Test
          </Button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center px-6 z-50 bg-black/50">
          <Card className="p-7 w-full max-w-sm">
            <div className="font-bold text-lg text-mist mb-2">Submit the test?</div>
            <div className="text-sm text-bronze mb-5">
              You've answered {answeredCount} of {total} questions. This can't be undone.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmOpen(false)}>
                Keep working
              </Button>
              <Button className="flex-1" onClick={() => submitExam(false)}>
                Submit
              </Button>
            </div>
          </Card>
        </div>
      )}

      {violationAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <Card className="w-full max-w-md border border-ember/40 p-7 gold-border-glow">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
              Proctoring alert
            </div>
            <div className="font-display text-2xl font-semibold text-mist">
              {isTabLeave ? "Tab switch detected" : "Exam window left"}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-bronze">
              {violationLabel(violationAlert.type)}. This has been logged and your teacher will see
              it on the result page.
            </p>
            <div className="mt-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-mist">
              Warning count this attempt:{" "}
              <span className="font-semibold text-ember">{violationAlert.count}</span>
            </div>
            <Button className="mt-6 w-full" onClick={() => setViolationAlert(null)}>
              Return to exam
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
