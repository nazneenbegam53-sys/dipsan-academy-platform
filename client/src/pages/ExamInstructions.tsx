import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Exam } from "../types";
import { Button, Card, Spinner, Badge } from "../components/ui";

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Exam not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-paper">
      <Card className="p-8 w-full max-w-lg">
        <Badge tone="marigold">{exam.subject}</Badge>
        <h1 className="text-2xl font-bold text-ink mt-3 mb-4">{exam.title}</h1>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl bg-gray-100 p-3 text-center">
            <div className="font-bold text-lg text-ink">{exam.questionCount ?? exam.questions.length}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
          <div className="rounded-xl bg-gray-100 p-3 text-center">
            <div className="font-bold text-lg text-ink">{exam.durationMinutes}</div>
            <div className="text-xs text-gray-500">Minutes</div>
          </div>
          <div className="rounded-xl bg-gray-100 p-3 text-center">
            <div className="font-bold text-lg text-ink">+{exam.defaultMarks}/&minus;{exam.defaultNegativeMarks}</div>
            <div className="text-xs text-gray-500">Marking</div>
          </div>
        </div>

        <div className="text-sm mb-5 rounded-xl p-4 bg-gray-50 border border-gray-200 text-gray-700 whitespace-pre-line">
          {exam.instructions || "Answer all questions within the time limit. Negative marking applies to wrong answers. There is no penalty for unattempted questions."}
        </div>

        {exam.antiCheat?.requireFullscreen && (
          <div className="text-xs mb-5 rounded-xl p-3 bg-orange-50 border border-orange-200 text-orange-700">
            This test requests fullscreen mode and monitors tab-switching. Switching away from the test window may be logged as a violation.
          </div>
        )}

        <label className="flex items-center gap-2 mb-5 text-sm text-ink cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read the instructions and I'm ready to begin.
        </label>
        <Button className="w-full" variant="accent" disabled={!agreed || starting} onClick={handleStart}>
          {starting ? "Starting…" : "Start Test"}
        </Button>
      </Card>
    </div>
  );
}
