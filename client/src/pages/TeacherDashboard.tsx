import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam } from "../types";
import { Button, Badge, Spinner, PageShell, Card, AppHeader } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { SupportButton } from "../components/SupportButton";

interface DashboardSummary {
  examCount: number;
  publishedCount: number;
  studentSubmissionCount: number;
  averageMarks: number;
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.get<{ exams: Exam[] }>("/exams/mine"),
      api.get<DashboardSummary>("/analytics/dashboard"),
    ])
      .then(([e, s]) => {
        setExams(e.exams);
        setSummary(s);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(exam: Exam) {
    const next = exam.status === "published" ? "draft" : "published";
    await api.patch(`/exams/${exam._id}/status`, { status: next });
    load();
  }

  async function performDelete(id: string) {
    await api.del(`/exams/${id}`);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <PageShell>
      <div className="fixed right-3 top-3 z-30 flex flex-nowrap items-center gap-1.5 sm:right-5 sm:top-5 sm:gap-2.5 md:right-8 md:top-6">
        <NotificationBell />
        <SupportButton />
        <BrandLogo size="sm" glow spinRing />
      </div>

      <div className="mx-auto max-w-6xl animate-fade-up px-6 py-10 pr-20">
        <AppHeader
          title={`Welcome, ${user?.name}`}
          subtitle="Teacher dashboard"
          actions={
            <>
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
              <Button variant="ghost" onClick={load}>
                Refresh
              </Button>
              <Button variant="ghost" onClick={() => navigate("/teacher/results")}>
                Results by exam
              </Button>
              <Button onClick={() => navigate("/teacher/exam/new")}>+ New exam</Button>
            </>
          }
        />

        {summary && (
          <div className="mb-12 grid grid-cols-2 gap-6 border-y border-gold/15 py-8 sm:grid-cols-4">
            {[
              { label: "Exams", value: summary.examCount },
              { label: "Published", value: summary.publishedCount },
              { label: "Submissions", value: summary.studentSubmissionCount },
              { label: "Avg marks", value: summary.averageMarks },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-bronze">
                  {stat.label}
                </div>
                <div className="mt-1 font-display text-3xl font-semibold text-gold">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {loading && exams.length === 0 ? (
          <Spinner />
        ) : exams.length === 0 ? (
          <p className="border-t border-gold/15 pt-8 text-sm text-bronze">
            No exams yet — create your first one.
          </p>
        ) : (
          <ul className="divide-y divide-gold/10 border-y border-gold/15">
            {exams.map((e, i) => (
              <li
                key={e._id}
                className="flex animate-fade-up flex-col gap-5 py-7 lg:flex-row lg:items-center lg:justify-between"
                style={{ animationDelay: `${0.05 + i * 0.05}s` }}
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="marigold">{e.subject}</Badge>
                    <Badge tone={e.status === "published" ? "success" : "ink"}>{e.status}</Badge>
                    <Badge tone="signal">{e.submissionCount ?? 0} submissions</Badge>
                  </div>
                  <div className="font-display text-xl font-semibold text-mist">{e.title}</div>
                  <div className="mt-1 text-xs text-bronze">
                    {e.questionCount ?? e.questions?.length ?? 0} questions · {e.totalMarks} marks
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/edit`)}>
                    Edit
                  </Button>
                  <Button onClick={() => navigate(`/teacher/exam/${e._id}/results`)}>
                    Submissions ({e.submissionCount ?? 0})
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/teacher/exam/${e._id}/analytics`)}
                  >
                    Analytics
                  </Button>
                  <Button
                    variant={e.status === "published" ? "ghost" : "accent"}
                    onClick={() => togglePublish(e)}
                  >
                    {e.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDeleteId(e._id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-6">
            <Card className="w-full max-w-sm animate-fade-up p-7">
              <div className="mb-3 flex justify-center">
                <BrandLogo size="sm" glow />
              </div>
              <div className="text-center font-display text-xl font-semibold text-mist">
                Delete this exam?
              </div>
              <div className="mt-2 text-center text-sm text-bronze">
                Questions will be removed too. Existing results stay on record. This can&apos;t be
                undone.
              </div>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => performDelete(confirmDeleteId)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
