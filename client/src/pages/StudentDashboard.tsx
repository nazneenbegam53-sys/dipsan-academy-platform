import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam, Attempt } from "../types";
import { Button, Badge, Spinner, PageShell } from "../components/ui";

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

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-8">
          <div>
            <Link to="/" className="font-display text-xs font-semibold tracking-wide text-teal">
              Dipsan Academy
            </Link>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Hi, {user?.name}
            </h1>
            {user?.className && <p className="mt-1 text-sm text-forest/55">{user.className}</p>}
          </div>
          <Button variant="ghost" onClick={logout}>Log out</Button>
        </header>

        <section className="mb-14">
          <h2 className="font-display text-xl font-bold text-ink">Available exams</h2>
          <p className="mt-1 text-sm text-forest/55">Pick a paper and sit it under the clock.</p>

          {loading ? (
            <div className="mt-8"><Spinner /></div>
          ) : exams.length === 0 ? (
            <p className="mt-8 border-t border-ink/10 pt-8 text-sm text-forest/50">
              No exams published yet — check back soon.
            </p>
          ) : (
            <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
              {exams.map((e) => (
                <li key={e._id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Badge tone="marigold">{e.subject}</Badge>
                    <div className="mt-2 font-display text-lg font-bold text-ink">{e.title}</div>
                    <div className="mt-1 text-xs text-forest/50">
                      {e.questionCount} questions · {e.durationMinutes} min · {e.totalMarks} marks
                    </div>
                  </div>
                  <Button variant="accent" onClick={() => navigate(`/student/exam/${e._id}/instructions`)}>
                    Start test
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">Past attempts</h2>
          <p className="mt-1 text-sm text-forest/55">Scores and solution reviews.</p>

          {attempts.length === 0 ? (
            <p className="mt-8 border-t border-ink/10 pt-8 text-sm text-forest/50">
              You haven&apos;t submitted any exams yet.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto border-y border-ink/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink text-left text-xs text-mist">
                    <th className="px-4 py-3 font-semibold">Exam</th>
                    <th className="px-4 py-3 font-semibold">Score</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => {
                    const exam = a.exam as Exam;
                    return (
                      <tr key={a._id} className="border-t border-ink/10">
                        <td className="px-4 py-3.5 font-medium">{exam?.title}</td>
                        <td className="px-4 py-3.5 font-display font-bold">
                          {a.score}/{a.totalMarks}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-forest/50">
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(`/student/result/${a._id}`)}
                            className="text-xs font-semibold text-teal hover:text-ink"
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
          )}
        </section>
      </div>
    </PageShell>
  );
}
