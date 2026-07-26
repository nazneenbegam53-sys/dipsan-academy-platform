import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam } from "../types";
import { Button, Card, Badge, Spinner } from "../components/ui";

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

  //useEffect(load, []);
  useEffect(() => {
  load();

  const interval = setInterval(() => {
    load();
  }, 5000); // Refresh every 5 seconds

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
    <div className="min-h-screen bg-paper px-6 py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Welcome, {user?.name}</h1>
          <p className="text-sm text-gray-500">Dipsan Academy &middot; Teacher dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={logout}>Log out</Button>
          <Button variant="accent" onClick={() => navigate("/teacher/exam/new")}>+ New Exam</Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4"><div className="text-xs text-gray-500">EXAMS</div><div className="text-xl font-bold text-ink">{summary.examCount}</div></Card>
          <Card className="p-4"><div className="text-xs text-gray-500">PUBLISHED</div><div className="text-xl font-bold text-ink">{summary.publishedCount}</div></Card>
          <Card className="p-4"><div className="text-xs text-gray-500">SUBMISSIONS</div><div className="text-xl font-bold text-ink">{summary.studentSubmissionCount}</div></Card>
          <Card className="p-4"><div className="text-xs text-gray-500">AVG MARKS</div><div className="text-xl font-bold text-ink">{summary.averageMarks}</div></Card>
        </div>
      )}

      {loading ? <Spinner /> : exams.length === 0 ? (
        <Card className="p-10 text-center text-sm text-gray-500">No exams yet — create your first one.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((e) => (
            <Card key={e._id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge tone="marigold">{e.subject}</Badge>
                  <Badge tone={e.status === "published" ? "success" : "ink"}>{e.status}</Badge>
                </div>
                <div className="font-semibold text-ink mb-1">{e.title}</div>
                <div className="text-xs text-gray-500">{e.questionCount ?? e.questions?.length ?? 0} questions &middot; {e.totalMarks} marks</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/edit`)}>Edit</Button>
                <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/results`)}>Results</Button>
                <Button variant="ghost" onClick={() => navigate(`/teacher/exam/${e._id}/analytics`)}>Analytics</Button>
                <Button variant={e.status === "published" ? "ghost" : "accent"} onClick={() => togglePublish(e)}>
                  {e.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="danger" onClick={() => setConfirmDeleteId(e._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center px-6 z-50 bg-black/50">
          <Card className="p-7 w-full max-w-sm">
            <div className="font-bold text-lg text-ink mb-2">Delete this exam?</div>
            <div className="text-sm text-gray-500 mb-5">Questions will be removed too. Existing results stay on record. This can't be undone.</div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={() => performDelete(confirmDeleteId)}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
