import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam, Attempt } from "../types";
import { Button, Card, Badge, Spinner } from "../components/ui";

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
    <div className="min-h-screen bg-paper px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hi, {user?.name}</h1>
          <p className="text-sm text-gray-500">{user?.className}</p>
        </div>
        <Button variant="ghost" onClick={logout}>Log out</Button>
      </div>

      <h2 className="font-semibold text-ink mb-3">Available exams</h2>
      {loading ? <Spinner /> : exams.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500 mb-10">No exams published yet — check back soon.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {exams.map((e) => (
            <Card key={e._id} className="p-5">
              <Badge tone="marigold">{e.subject}</Badge>
              <div className="font-semibold text-ink mt-2 mb-1">{e.title}</div>
              <div className="text-xs text-gray-500 mb-4">
                {e.questionCount} questions &middot; {e.durationMinutes} min &middot; {e.totalMarks} marks
              </div>
              <Button className="w-full" onClick={() => navigate(`/student/exam/${e._id}/instructions`)}>Start Test</Button>
            </Card>
          ))}
        </div>
      )}

      <h2 className="font-semibold text-ink mb-3">Your past attempts</h2>
      {attempts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500">You haven't submitted any exams yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink text-paper text-left text-xs">
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const exam = a.exam as Exam;
                return (
                  <tr key={a._id} className="border-t border-gray-200">
                    <td className="px-4 py-3">{exam?.title}</td>
                    <td className="px-4 py-3 font-semibold">{a.score}/{a.totalMarks}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/student/result/${a._id}`)} className="text-xs font-semibold text-ink">View →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
