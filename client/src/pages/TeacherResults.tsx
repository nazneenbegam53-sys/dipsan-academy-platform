import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Attempt, Exam, User } from "../types";
import { Button, Card, Spinner, Badge } from "../components/ui";
import { violationLabel } from "../hooks/useAntiCheat";

function countTabSwitches(violations: Attempt["violations"] = []) {
  return violations.filter((v) => v.type === "visibility-hidden" || v.type === "tab-blur").length;
}

export default function TeacherResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ attempt: Attempt; exam: Exam } | null>(null);
  const [showViolations, setShowViolations] = useState(false);
  const [violationReport, setViolationReport] = useState<
    { student: User; violationCount: number; violations: Attempt["violations"] }[]
  >([]);

  function load() {
    setLoading(true);
    api
      .get<{ attempts: Attempt[] }>(`/results/${examId}`)
      .then((r) => setAttempts(r.attempts))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function openDetail(attemptId: string) {
    const res = await api.get<{ attempt: Attempt; exam: Exam }>(
      `/results/${examId}/${attemptId}`
    );
    setDetail(res);
  }

  async function openViolations() {
    const res = await api.get<{
      report: { student: User; violationCount: number; violations: Attempt["violations"] }[];
    }>(`/results/${examId}/violations`);
    setViolationReport(res.report);
    setShowViolations(true);
  }

  if (detail) {
    const student = detail.attempt.student as User;
    const violations = detail.attempt.violations || [];
    const tabSwitches = countTabSwitches(violations);

    return (
      <div className="min-h-screen bg-paper px-6 py-8 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setDetail(null)} className="mb-5">
          ← Back to results
        </Button>
        <h1 className="text-xl font-bold text-mist mb-1">{student.name}</h1>
        <p className="text-sm text-bronze mb-6">{detail.exam.title}</p>

        <div className="grid grid-cols-2 gap-3 mb-7 sm:grid-cols-4">
          <Card className="p-4 bg-charcoal text-mist border-gold/30">
            <div className="text-xs text-bronze">SCORE</div>
            <div className="text-xl font-bold text-gold">
              {detail.attempt.score}/{detail.attempt.totalMarks}
            </div>
          </Card>
          <Card className="p-4 bg-teal/10 border border-aurora/20">
            <div className="text-xs text-aurora">CORRECT</div>
            <div className="text-xl font-bold text-aurora">{detail.attempt.correctCount}</div>
          </Card>
          <Card className="p-4 bg-ember/15 border border-ember/20">
            <div className="text-xs text-ember">WRONG</div>
            <div className="text-xl font-bold text-ember">{detail.attempt.wrongCount}</div>
          </Card>
          <Card className="p-4 bg-paper border border-white/10">
            <div className="text-xs text-bronze">UNATTEMPTED</div>
            <div className="text-xl font-bold text-bronze">{detail.attempt.unattemptedCount}</div>
          </Card>
        </div>

        {violations.length > 0 ? (
          <Card className="mb-6 border border-ember/35 bg-ember/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Proctoring notice
                </div>
                <div className="mt-1 font-display text-xl font-semibold text-mist">
                  {tabSwitches} tab switch{tabSwitches === 1 ? "" : "es"} · {violations.length}{" "}
                  total alert{violations.length === 1 ? "" : "s"}
                </div>
                <p className="mt-1 text-sm text-bronze">
                  Logged while {student.name} was attempting this paper.
                </p>
              </div>
              <Badge tone="danger">{tabSwitches} tab</Badge>
            </div>
            <ul className="mt-4 max-h-48 space-y-2 overflow-auto border-t border-ember/20 pt-4">
              {violations.map((v, i) => (
                <li
                  key={`${v.at}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper/40 px-3 py-2 text-sm"
                >
                  <span className="text-mist">{violationLabel(v.type)}</span>
                  <span className="text-xs text-bronze">
                    {v.at ? new Date(v.at).toLocaleString() : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="mb-6 border border-aurora/20 bg-aurora/5 p-4 text-sm text-bronze">
            No tab-switch or window-leave alerts for this attempt.
          </Card>
        )}

        <div className="space-y-4">
          {detail.exam.questions.map((q, i) => {
            const entry = detail.attempt.answers[q._id];
            const selected = entry?.selected;
            return (
              <Card key={q._id} className="p-5">
                <div className="text-xs text-gold font-mono mb-2">QUESTION {i + 1}</div>
                <div className="text-sm font-medium text-mist mb-3">{q.text}</div>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="max-h-56 rounded-lg mb-3 border border-white/10"
                  />
                )}
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    let cls = "border border-white/15";
                    if (oi === q.correctOptionIndex)
                      cls = "border border-aurora/50 bg-aurora/10";
                    if (selected === oi && oi !== q.correctOptionIndex)
                      cls = "border border-ember/50 bg-ember/15";
                    return (
                      <div key={oi} className={`rounded-lg px-3 py-2 text-sm text-mist ${cls}`}>
                        <span className="font-semibold mr-1.5">{"ABCD"[oi]}.</span>
                        {opt}
                      </div>
                    );
                  })}
                </div>
                {(q.explanation || q.explanationImageUrl) && (
                  <div className="mt-3 rounded-xl border-l-4 border-gold bg-gold/15 px-3 py-2 text-xs text-mist">
                    {q.explanation && (
                      <div>
                        <span className="font-semibold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                    {q.explanationImageUrl && (
                      <img
                        src={q.explanationImageUrl}
                        alt="Solution"
                        className="mt-2 max-h-48 rounded-lg border border-white/10"
                      />
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
        <Button variant="ghost" onClick={() => navigate("/teacher")}>
          ← Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={openViolations}>
            Tab-switch report
          </Button>
          <Button variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>
      <h1 className="text-xl font-bold text-mist mb-2">Submissions</h1>
      <p className="text-sm text-bronze mb-6">
        Student submissions for this exam — tab switches appear as alerts.
      </p>

      {loading ? (
        <Spinner />
      ) : attempts.length === 0 ? (
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
                <th className="px-4 py-3">Alerts</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const s = a.student as User;
                const tabs = countTabSwitches(a.violations);
                const totalV = a.violations?.length || 0;
                return (
                  <tr key={a._id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium text-mist">{s.name}</td>
                    <td className="px-4 py-3 font-semibold text-gold">
                      {a.score}/{a.totalMarks}
                    </td>
                    <td className="px-4 py-3 text-aurora">{a.correctCount}</td>
                    <td className="px-4 py-3 text-ember">{a.wrongCount}</td>
                    <td className="px-4 py-3">
                      {totalV > 0 ? (
                        <Badge tone="danger">
                          {tabs} tab · {totalV} total
                        </Badge>
                      ) : (
                        <span className="text-xs text-bronze">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-bronze">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(a._id)}
                        className="text-xs font-semibold text-mist hover:text-gold"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {showViolations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <Card className="p-7 w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Proctoring
                </div>
                <div className="font-bold text-mist">Tab-switch report</div>
              </div>
              <button onClick={() => setShowViolations(false)} className="text-bronze/70">
                ✕
              </button>
            </div>
            {violationReport.length === 0 ? (
              <div className="text-sm text-bronze">No violations logged for this exam.</div>
            ) : (
              <div className="space-y-4">
                {violationReport.map((r, i) => (
                  <div key={i} className="rounded-xl border border-ember/25 bg-ember/5 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-mist">{r.student.name}</div>
                      <Badge tone="danger">
                        {countTabSwitches(r.violations)} tab · {r.violationCount} total
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-bronze">
                      {r.violations.map((v, vi) => (
                        <li key={vi} className="flex justify-between gap-3">
                          <span className="text-mist">{violationLabel(v.type)}</span>
                          <span>{v.at ? new Date(v.at).toLocaleString() : "—"}</span>
                        </li>
                      ))}
                    </ul>
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
