import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam, Attempt } from "../types";
import { Button, Badge, Spinner, PageShell, AppHeader, Card } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

type ExamAttemptGroup = {
  examId: string;
  title: string;
  subject?: string;
  attempts: Attempt[];
};

function groupAttemptsByExam(attempts: Attempt[]): ExamAttemptGroup[] {
  const map = new Map<string, ExamAttemptGroup>();

  for (const a of attempts) {
    const exam = a.exam as Exam | undefined;
    const examId =
      typeof a.exam === "string" ? a.exam : exam?._id || exam?.title || "unknown";
    const title = exam?.title || "Untitled exam";
    const subject = exam?.subject;
    const existing = map.get(examId);
    if (existing) {
      existing.attempts.push(a);
    } else {
      map.set(examId, { examId, title, subject, attempts: [a] });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ exams: Exam[] }>("/exams/published"),
      api.get<{ attempts: Attempt[] }>("/attempts/mine"),
    ])
      .then(([e, a]) => {
        setExams(e.exams);
        setAttempts(a.attempts);
      })
      .finally(() => setLoading(false));
  }, []);

  const attemptGroups = useMemo(() => groupAttemptsByExam(attempts), [attempts]);

  return (
    <PageShell>
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="sm" glow spinRing />
      </div>

      <div className="mx-auto max-w-5xl animate-fade-up px-6 py-10 pr-20">
        <AppHeader
          title={`Hi, ${user?.name}`}
          subtitle={user?.className || "Student dashboard"}
          actions={
            <>
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            </>
          }
        />

        <section className="mb-14">
          <h2 className="font-display text-2xl font-semibold text-champagne">Available exams</h2>
          <p className="mt-1 text-sm text-bronze">Pick a paper and sit it under the clock.</p>

          {loading ? (
            <div className="mt-8">
              <Spinner />
            </div>
          ) : exams.length === 0 ? (
            <p className="mt-8 border-t border-gold/15 pt-8 text-sm text-bronze">
              No exams published yet — check back soon.
            </p>
          ) : (
            <ul className="mt-8 divide-y divide-gold/10 border-y border-gold/15">
              {exams.map((e, i) => (
                <li
                  key={e._id}
                  className="flex animate-fade-up flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div>
                    <Badge tone="marigold">{e.subject}</Badge>
                    <div className="mt-2 font-display text-xl font-semibold text-mist">{e.title}</div>
                    <div className="mt-1 text-xs text-bronze">
                      {e.questionCount} questions · {e.durationMinutes} min · {e.totalMarks} marks
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/student/exam/${e._id}/instructions`)}>
                    Start test
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-champagne">Past attempts</h2>
          <p className="mt-1 text-sm text-bronze">
            Results grouped by exam name — open any attempt to review solutions.
          </p>

          {loading ? (
            <div className="mt-8">
              <Spinner />
            </div>
          ) : attemptGroups.length === 0 ? (
            <p className="mt-8 border-t border-gold/15 pt-8 text-sm text-bronze">
              You haven&apos;t submitted any exams yet.
            </p>
          ) : (
            <div className="mt-8 space-y-8">
              {attemptGroups.map((group) => (
                <Card key={group.examId} className="overflow-hidden">
                  <div className="border-b border-white/10 bg-charcoal/60 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {group.subject && <Badge tone="marigold">{group.subject}</Badge>}
                      <Badge tone="ink">
                        {group.attempts.length} attempt
                        {group.attempts.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold text-mist">
                      {group.title}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-paper/40 text-left text-xs text-gold">
                          <th className="px-4 py-3 font-semibold">Score</th>
                          <th className="px-4 py-3 font-semibold">Submitted</th>
                          <th className="px-4 py-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.attempts.map((a) => (
                          <tr key={a._id} className="border-t border-gold/10">
                            <td className="px-4 py-3.5 font-display text-lg font-semibold text-gold">
                              {a.score}/{a.totalMarks}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-bronze">
                              {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => navigate(`/student/result/${a._id}`)}
                                className="text-xs font-semibold text-gold hover:text-champagne"
                              >
                                View →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
