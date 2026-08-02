import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam, Attempt } from "../types";
import { Button, Badge, Spinner, PageShell, AppHeader } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

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
          <p className="mt-1 text-sm text-bronze">Scores and solution reviews.</p>

          {attempts.length === 0 ? (
            <p className="mt-8 border-t border-gold/15 pt-8 text-sm text-bronze">
              You haven&apos;t submitted any exams yet.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-gold/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-charcoal text-left text-xs text-gold">
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
                      <tr key={a._id} className="border-t border-gold/10">
                        <td className="px-4 py-3.5 font-medium text-mist">{exam?.title}</td>
                        <td className="px-4 py-3.5 font-display text-lg font-semibold text-gold">
                          {a.score}/{a.totalMarks}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-bronze">
                          {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(`/student/result/${a._id}`)}
                            className="text-xs font-semibold text-gold hover:text-champagne"
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
