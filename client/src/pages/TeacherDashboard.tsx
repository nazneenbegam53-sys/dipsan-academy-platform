import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam } from "../types";
import { Button, Badge, Spinner, PageShell, Card } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

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
    ]).then(([e, s]) => { setExams(e.exams); setSummary(s); }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(interval);
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
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-gold/15 pb-8">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" />
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-champagne md:text-4xl">
                Welcome, {user?.name}
              </h1>
              <p className="mt-1 text-sm text-bronze">Teacher dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={logout}>Log out</Button>
            <Button onClick={() => navigate("/teacher/exam/new")}>+ New exam</Button>
          </div>
        </header>

        {summary && (
          <div className="mb-12 grid grid-cols-2 gap-6 border-y border-gold/15 py-8 sm:grid-cols-4">
            {[
              { label: "Exams", value: summary.examCount },
              { label: "Published", value: summary.publishedCount },
              { label: "Submissions", value: summary.studentSubmissionCount },
              { label: "Avg marks", value: summary.averageMarks },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xs font-semibold uppercase tracking-wide text-bronze">{stat.label}</div>
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
            {exams.map((e) => (
              <li key={e._id} className="flex flex-col gap-5 py-7 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="marigold">{e.subject}</Badge>
                    <Badge tone={e.status === "published" ? "success" : "ink"}>{e.status}</Badge>
                  </div>
                  <div className="font-display text-xl font-semibold text-mist">{e.title}</div>
                  <div className="mt-1 text-xs text-bronze">
                    {e.questionCount ?? e.questions?.length ?? 0} questions · {e.totalMarks} marks
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/edit`)}>Edit</Button>
                  <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/results`)}>Results</Button>
                  <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/analytics`)}>Analytics</Button>
                  <Button variant={e.status === "published" ? "ghost" : "accent"} onClick={() => togglePublish(e)}>
                    {e.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmDeleteId(e._id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-6">
            <Card className="w-full max-w-sm p-7">
              <div className="font-display text-xl font-semibold text-champagne">Delete this exam?</div>
              <div className="mt-2 text-sm text-bronze">
                Questions will be removed too. Existing results stay on record. This can&apos;t be undone.
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={() => performDelete(confirmDeleteId)}>Delete</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
