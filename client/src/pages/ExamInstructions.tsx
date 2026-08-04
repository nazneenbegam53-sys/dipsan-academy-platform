import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ApiError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam } from "../types";
import { Button, Card, Spinner, Badge } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

export default function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const subscribed = Boolean(user?.subscriptionActive);

  useEffect(() => {
    api
      .get<{ exam: Exam }>(`/exams/${examId}/student-view`)
      .then((r) => setExam(r.exam))
      .finally(() => setLoading(false));
  }, [examId]);

  async function handleStart() {
    if (!subscribed) {
      navigate("/subscribe");
      return;
    }
    setStarting(true);
    setError("");
    try {
      const res = await api.post<{ attempt: { _id: string; startedAt: string } }>(
        `/attempts/${examId}/start`
      );
      navigate(`/student/exam/${examId}/attempt/${res.attempt._id}`, {
        state: { startedAt: res.attempt.startedAt },
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "SUBSCRIPTION_REQUIRED") {
        navigate("/subscribe");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not start the test.");
    } finally {
      setStarting(false);
    }
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Spinner />
      </div>
    );
  if (!exam)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-bronze">
        Exam not found.
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>
      <Card className="w-full max-w-lg p-8">
        <Badge tone="marigold">{exam.subject}</Badge>
        <h1 className="mb-4 mt-3 font-display text-3xl font-semibold text-mist">{exam.title}</h1>

        {!subscribed && (
          <div className="mb-5 rounded-sm border border-gold/30 bg-gold/10 p-4 text-sm text-mist">
            <p className="font-semibold text-champagne">Subscription required</p>
            <p className="mt-1 text-bronze">
              Pay ₹2000 once to unlock all mock tests and solutions.
            </p>
            <Link to="/subscribe" className="mt-3 inline-block text-sm font-semibold text-gold">
              Subscribe now →
            </Link>
          </div>
        )}

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-sm border border-gold/10 bg-paper p-3 text-center">
            <div className="font-display text-lg font-semibold text-gold">
              {exam.questionCount ?? exam.questions.length}
            </div>
            <div className="text-xs text-bronze">Questions</div>
          </div>
          <div className="rounded-sm border border-gold/10 bg-paper p-3 text-center">
            <div className="font-display text-lg font-semibold text-gold">{exam.durationMinutes}</div>
            <div className="text-xs text-bronze">Minutes</div>
          </div>
          <div className="rounded-sm border border-gold/10 bg-paper p-3 text-center">
            <div className="font-display text-lg font-semibold text-gold">
              +{exam.defaultMarks}/&minus;{exam.defaultNegativeMarks}
            </div>
            <div className="text-xs text-bronze">Marking</div>
          </div>
        </div>

        <div className="mb-5 whitespace-pre-line rounded-sm border border-gold/10 bg-paper p-4 text-sm text-bronze">
          {exam.instructions ||
            "Answer all questions within the time limit. Negative marking applies to wrong answers. There is no penalty for unattempted questions."}
        </div>

        {exam.antiCheat?.requireFullscreen && (
          <div className="mb-5 rounded-sm border border-gold/30 bg-gold/10 p-3 text-xs text-mist">
            This test requests fullscreen mode and monitors tab-switching. Switching away from the
            test window may be logged as a violation.
          </div>
        )}

        {error && <p className="mb-4 text-sm text-ember">{error}</p>}

        <label className="mb-5 flex cursor-pointer items-center gap-2 text-sm text-mist">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="accent-gold"
          />
          I have read the instructions and I&apos;m ready to begin.
        </label>
        <Button className="w-full" disabled={!agreed || starting} onClick={handleStart}>
          {starting
            ? "Starting…"
            : subscribed
              ? "Start Test"
              : "Subscribe to start"}
        </Button>
      </Card>
    </div>
  );
}
