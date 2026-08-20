import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Attempt, Exam, User } from "../types";
import { Button, Card, Spinner, Badge, PageShell } from "../components/ui";
import { SolutionVideoPlayer } from "../components/SolutionVideoPlayer";
import { violationLabel } from "../hooks/useAntiCheat";

function countTabSwitches(violations: Attempt["violations"] = []) {
  return violations.filter((v) => v.type === "visibility-hidden" || v.type === "tab-blur").length;
}

type ExamResultGroup = {
  exam: Exam;
  attempts: Attempt[];
};

export default function TeacherResults() {
  const { examId: focusExamId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ExamResultGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ attempt: Attempt; exam: Exam } | null>(null);
  const [showViolations, setShowViolations] = useState(false);
  const [violationExamId, setViolationExamId] = useState<string | null>(null);
  const [violationReport, setViolationReport] = useState<
    { student: User; violationCount: number; violations: Attempt["violations"] }[]
  >([]);
  const focusRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { exams } = await api.get<{ exams: Exam[] }>("/exams/mine");
      const sorted = [...exams].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
      const results = await Promise.all(
        sorted.map(async (exam) => {
          try {
            const res = await api.get<{ attempts: Attempt[] }>(`/results/${exam._id}`);
            return { exam, attempts: res.attempts };
          } catch {
            return { exam, attempts: [] as Attempt[] };
          }
        })
      );
      setGroups(results);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!loading && focusExamId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, focusExamId, groups]);

  const visibleGroups = useMemo(() => {
    // Always keep results together under every exam name that has submissions;
    // exams with zero submissions still show so teachers see the full set.
    return groups;
  }, [groups]);

  async function openDetail(exam: Exam, attemptId: string) {
    const res = await api.get<{ attempt: Attempt; exam: Exam }>(
      `/results/${exam._id}/${attemptId}`
    );
    setDetail(res);
  }

  async function openViolations(examId: string) {
    const res = await api.get<{
      report: { student: User; violationCount: number; violations: Attempt["violations"] }[];
    }>(`/results/${examId}/violations`);
    setViolationReport(res.report);
    setViolationExamId(examId);
    setShowViolations(true);
  }

  if (detail) {
    const student = detail.attempt.student as User;
    const violations = detail.attempt.violations || [];
    const tabSwitches = countTabSwitches(violations);

    return (
      <div className="mx-auto min-h-[100dvh] max-w-3xl bg-paper px-4 py-6 sm:px-6 sm:py-8">
        <Button variant="ghost" onClick={() => setDetail(null)} className="mb-5">
          ← Back to results
        </Button>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold mb-1">
          {detail.exam.title}
        </p>
        <h1 className="text-xl font-bold text-mist mb-1">{student.name}</h1>
        <p className="text-sm text-bronze mb-6">
          {detail.exam.subject} · attempt result
        </p>

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
                    const isCorrect = oi === q.correctOptionIndex;
                    const isWrongPick =
                      selected === oi && oi !== q.correctOptionIndex;
                    let cls = "border border-white/15 bg-white/5 text-mist";
                    let label = "";
                    if (isCorrect) {
                      cls =
                        "border border-emerald-400/70 bg-emerald-500/20 text-emerald-100";
                      label = "Correct";
                    }
                    if (isWrongPick) {
                      cls = "border border-red-400/70 bg-red-500/20 text-red-100";
                      label = "Their answer";
                    }
                    return (
                      <div
                        key={oi}
                        className={`flex flex-wrap items-center rounded-lg px-3 py-2.5 text-sm ${cls}`}
                      >
                        <span className="mr-1.5 font-semibold">{"ABCD"[oi]}.</span>
                        <span className="flex-1">{opt}</span>
                        {label && (
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              isWrongPick
                                ? "bg-red-400/25 text-red-200"
                                : "bg-emerald-400/25 text-emerald-200"
                            }`}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(q.explanation || q.explanationImageUrl || q.explanationVideoUrl) && (
                  <div className="mt-3 space-y-3 rounded-xl border-l-4 border-gold bg-gold/15 px-3 py-2 text-xs text-mist">
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
                    {q.explanationVideoUrl && (
                      <div className="mt-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
                          Video solution
                          {q.explanationVideoStatus === "published" ? " · published" : " · draft"}
                        </p>
                        <SolutionVideoPlayer
                          src={q.explanationVideoUrl}
                          className="aspect-video w-full max-w-xl rounded-xl border border-white/10 bg-black"
                        />
                      </div>
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
    <PageShell>
      <div className="mx-auto max-w-5xl screen-pad py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/teacher")}>
            ← Dashboard
          </Button>
          <Button variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>

        <h1 className="font-display text-3xl font-semibold text-mist">Results by exam</h1>
        <p className="mt-1 mb-8 text-sm text-bronze">
          Submissions are kept together under each exam name.
        </p>

        {loading ? (
          <Spinner />
        ) : visibleGroups.length === 0 ? (
          <Card className="p-10 text-center text-sm text-bronze">No exams yet.</Card>
        ) : (
          <div className="space-y-8">
            {visibleGroups.map(({ exam, attempts }) => {
              const focused = focusExamId === exam._id;
              return (
                <div
                  key={exam._id}
                  id={`exam-${exam._id}`}
                  ref={focused ? focusRef : undefined}
                  className={`overflow-hidden rounded-2xl border ${
                    focused ? "border-gold/50 gold-border-glow" : "border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-charcoal/70 px-5 py-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="marigold">{exam.subject}</Badge>
                        <Badge tone={exam.status === "published" ? "success" : "ink"}>
                          {exam.status}
                        </Badge>
                        <Badge tone="signal">
                          {attempts.length} submission{attempts.length === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-mist">
                        {exam.title}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => openViolations(exam._id)}>
                        Tab-switch report
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/teacher/exam/${exam._id}/analytics`)}
                      >
                        Analytics
                      </Button>
                    </div>
                  </div>

                  {attempts.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-bronze">No submissions yet for this exam.</div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-paper/50 text-left text-xs text-gold">
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
                                  {a.submittedAt
                                    ? new Date(a.submittedAt).toLocaleString()
                                    : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => openDetail(exam, a._id)}
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
                      </div>
                      <ul className="divide-y divide-white/10 md:hidden">
                        {attempts.map((a) => {
                          const s = a.student as User;
                          const tabs = countTabSwitches(a.violations);
                          const totalV = a.violations?.length || 0;
                          return (
                            <li key={a._id} className="px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate font-medium text-mist">{s.name}</div>
                                  <div className="mt-1 text-xs text-bronze">
                                    {a.submittedAt
                                      ? new Date(a.submittedAt).toLocaleString()
                                      : "—"}
                                  </div>
                                </div>
                                <div className="shrink-0 font-semibold text-gold">
                                  {a.score}/{a.totalMarks}
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-aurora">Correct {a.correctCount}</span>
                                <span className="text-ember">Wrong {a.wrongCount}</span>
                                {totalV > 0 ? (
                                  <Badge tone="danger">
                                    {tabs} tab · {totalV} total
                                  </Badge>
                                ) : (
                                  <span className="text-bronze">No alerts</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => openDetail(exam, a._id)}
                                className="mt-3 text-xs font-semibold text-champagne"
                              >
                                View result →
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showViolations && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
            <Card className="p-7 w-full max-w-lg max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    Proctoring
                  </div>
                  <div className="font-bold text-mist">
                    Tab-switch report
                    {violationExamId && (
                      <span className="mt-1 block text-xs font-normal text-bronze">
                        {groups.find((g) => g.exam._id === violationExamId)?.exam.title}
                      </span>
                    )}
                  </div>
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
                    <div
                      key={i}
                      className="rounded-xl border border-ember/25 bg-ember/5 p-4 text-sm"
                    >
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
    </PageShell>
  );
}
