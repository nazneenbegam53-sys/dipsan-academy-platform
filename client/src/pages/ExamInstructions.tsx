import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Exam } from "../types";
import { Button, Card, Spinner, Badge } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

export default function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.get<{ exam: Exam }>(`/exams/${examId}/student-view`).then((r) => setExam(r.exam)).finally(() => setLoading(false));
  }, [examId]);

  async function handleStart() {
    setStarting(true);
    try {
      const res = await api.post<{ attempt: { _id: string; startedAt: string } }>(`/attempts/${examId}/start`);
      navigate(`/student/exam/${examId}/attempt/${res.attempt._id}`, { state: { startedAt: res.attempt.startedAt } });
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-paper"><Spinner /></div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center bg-paper text-sm text-bronze">Exam not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-paper">
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>
      <Card className="p-8 w-full max-w-lg">
        <Badge tone="marigold">{exam.subject}</Badge>
        <h1 className="font-display text-3xl font-semibold text-mist mt-3 mb-4">{exam.title}</h1>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-sm bg-paper border border-gold/10 p-3 text-center">
            <div className="font-display text-lg font-semibold text-gold">{exam.questionCount ?? exam.questions.length}</div>
            <div className="text-xs text-bronze">Questions</div>
          </div>
          <div className="rounded-sm bg-paper border border-gold/10 p-3 text-center">
            <div className="font-display text-lg font-semibold text-gold">{exam.durationMinutes}</div>
            <div className="text-xs text-bronze">Minutes</div>
          </div>
          <div className="rounded-sm bg-paper border border-gold/10 p-3 text-center">
            <div className="font-display text-lg font-semibold text-gold">+{exam.defaultMarks}/&minus;{exam.defaultNegativeMarks}</div>
            <div className="text-xs text-bronze">Marking</div>
          </div>
        </div>

        <div className="text-sm mb-5 rounded-sm p-4 bg-paper border border-gold/10 text-bronze whitespace-pre-line">
          {exam.instructions || "Answer all questions within the time limit. Negative marking applies to wrong answers. There is no penalty for unattempted questions."}
        </div>

        {exam.antiCheat?.requireFullscreen && (
          <div className="text-xs mb-5 rounded-sm p-3 bg-gold/10 border border-gold/30 text-mist">
            This test requests fullscreen mode and monitors tab-switching. Switching away from the test window may be logged as a violation.
          </div>
        )}

        <label className="flex items-center gap-2 mb-5 text-sm text-mist cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-gold" />
          I have read the instructions and I&apos;m ready to begin.
        </label>
        <Button className="w-full" disabled={!agreed || starting} onClick={handleStart}>
          {starting ? "Starting…" : "Start Test"}
        </Button>
      </Card>
    </div>
  );
}
