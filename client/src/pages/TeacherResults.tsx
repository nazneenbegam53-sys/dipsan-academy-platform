import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Attempt, Exam, User } from "../types";
import { Button, Card, Spinner, Badge } from "../components/ui";

export default function TeacherResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ attempt: Attempt; exam: Exam } | null>(null);
  const [showViolations, setShowViolations] = useState(false);
  const [violationReport, setViolationReport] = useState<any[]>([]);

  function load() {
    setLoading(true);
    api.get<{ attempts: Attempt[] }>(`/results/${examId}`).then((r) => setAttempts(r.attempts)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [examId]);

  async function openDetail(attemptId: string) {
    const res = await api.get<{ attempt: Attempt; exam: Exam }>(`/results/${examId}/${attemptId}`);
    setDetail(res);
  }

  async function openViolations() {
    const res = await api.get<{ report: any[] }>(`/results/${examId}/violations`);
    setViolationReport(res.report);
    setShowViolations(true);
  }

  if (detail) {
    const student = detail.attempt.student as User;
    return (
      <div className="min-h-screen bg-paper px-6 py-8 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setDetail(null)} className="mb-5">← Back to results</Button>
        <h1 className="text-xl font-bold text-ink mb-1">{student.name}</h1>
        <p className="text-sm text-bronze mb-6">{detail.exam.title}</p>

        <div className="grid grid-cols-4 gap-3 mb-7">
          <Card className="p-4 bg-charcoal text-ink border-gold/30"><div className="text-xs text-bronze">SCORE</div><div className="text-xl font-bold text-gold">{detail.attempt.score}/{detail.attempt.totalMarks}</div></Card>
          <Card className="p-4 bg-teal/10 border border-gold/10 border-none"><div className="text-xs text-green-700">CORRECT</div><div className="text-xl font-bold text-green-700">{detail.attempt.correctCount}</div></Card>
          <Card className="p-4 bg-ember/15 border-none"><div className="text-xs text-red-700">WRONG</div><div className="text-xl font-bold text-red-700">{detail.attempt.wrongCount}</div></Card>
          <Card className="p-4 bg-paper border border-ink/10 border-none"><div className="text-xs text-bronze">UNATTEMPTED</div><div className="text-xl font-bold text-bronze">{detail.attempt.unattemptedCount}</div></Card>
        </div>

        {detail.attempt.violations.length > 0 && (
          <Card className="p-4 mb-6 bg-orange-50 border-orange-200 text-sm text-orange-700">
            {detail.attempt.violations.length} anti-cheat violation(s) logged during this attempt.
          </Card>
        )}

        <div className="space-y-4">
          {detail.exam.questions.map((q, i) => {
            const entry = detail.attempt.answers[q._id];
            const selected = entry?.selected;
            return (
              <Card key={q._id} className="p-5">
                <div className="text-xs text-orange-600 font-mono mb-2">QUESTION {i + 1}</div>
                <div className="text-sm font-medium text-ink mb-3">{q.text}</div>
                {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-56 rounded-lg mb-3 border border-ink/10" />}
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    let cls = "border border-ink/15";
                    if (oi === q.correctOptionIndex) cls = "border border-green-500 bg-teal/10 border border-gold/10";
                    if (selected === oi && oi !== q.correctOptionIndex) cls = "border border-red-500 bg-ember/15";
                    return <div key={oi} className={`rounded-lg px-3 py-2 text-sm ${cls}`}><span className="font-semibold mr-1.5">{"ABCD"[oi]}.</span>{opt}</div>;
                  })}
                </div>
                {(q.explanation || q.explanationImageUrl) && (
                  <div className="mt-3 rounded-xl border-l-4 border-gold bg-champagne/50 px-3 py-2 text-xs text-ink/80">
                    {q.explanation && (
                      <div><span className="font-semibold">Explanation: </span>{q.explanation}</div>
                    )}
                    {q.explanationImageUrl && (
                      <img src={q.explanationImageUrl} alt="Solution" className="mt-2 max-h-48 rounded-lg border border-ink/10" />
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/teacher")}>← Dashboard</Button>
        <div className="flex gap-2">
          {/* <Button variant="ghost" onClick={openViolations}>Violation report</Button>
          <Button variant="ghost" onClick={load}>Refresh</Button> */}
        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>
        </div>
      </div>
      <h1 className="text-xl font-bold text-ink mb-2">Submissions</h1>
      <p className="text-sm text-bronze mb-6">Student submissions for this exam only.</p>

      {loading ? <Spinner /> : attempts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-bronze">No submissions yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-charcoal text-gold text-left text-xs">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Correct</th>
                <th className="px-4 py-3">Wrong</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const s = a.student as User;
                return (
                  <tr key={a._id} className="border-t border-ink/10">
                    <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-3 font-semibold text-orange-600">{a.score}/{a.totalMarks}</td>
                    <td className="px-4 py-3 text-green-700">{a.correctCount}</td>
                    <td className="px-4 py-3 text-red-600">{a.wrongCount}</td>
                    <td className="px-4 py-3 text-xs text-bronze">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3"><button onClick={() => openDetail(a._id)} className="text-xs font-semibold text-ink">View →</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {showViolations && (
        <div className="fixed inset-0 flex items-center justify-center px-6 z-50 bg-black/50">
          <Card className="p-7 w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-ink">Violation report</div>
              <button onClick={() => setShowViolations(false)} className="text-bronze/70">✕</button>
            </div>
            {violationReport.length === 0 ? (
              <div className="text-sm text-bronze">No violations logged for this exam.</div>
            ) : (
              <div className="space-y-3">
                {violationReport.map((r, i) => (
                  <div key={i} className="text-sm border-b border-ink/10 pb-2">
                    <div className="font-semibold text-ink">{r.student.name} — {r.violationCount} violation(s)</div>
                    <div className="text-xs text-bronze">{r.violations.map((v: any) => v.type).join(", ")}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
