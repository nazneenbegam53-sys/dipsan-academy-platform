import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Exam } from "../types";
import { Button, Badge, Spinner, PageShell, Card, AppHeader, ErrorBanner } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { SupportButton } from "../components/SupportButton";

interface DashboardSummary {
  examCount: number;
  publishedCount: number;
  studentSubmissionCount: number;
  averageMarks: number;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  className: string | null;
  rollNumber: string | null;
  subscriptionPaidAt: string | null;
  subscriptionAmountInr: number | null;
  subscriptionPaymentId: string | null;
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState("");
  const [grantError, setGrantError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      api.get<{ exams: Exam[] }>("/exams/mine"),
      api.get<DashboardSummary>("/analytics/dashboard"),
      api.get<{ count: number; subscribers: Subscriber[] }>("/payments/subscribers"),
    ])
      .then(([e, s, sub]) => {
        setExams(e.exams);
        setSummary(s);
        setSubscribers(sub.subscribers);
        setSubscriberCount(sub.count);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash === "#subscribers") {
      document.getElementById("subscribers")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

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

  async function grantAccess(e: React.FormEvent) {
    e.preventDefault();
    setGrantError("");
    setGrantMsg("");
    setGrantBusy(true);
    try {
      const res = await api.post<{ message: string }>("/payments/grant", {
        email: grantEmail.trim(),
      });
      setGrantMsg(res.message);
      setGrantEmail("");
      load();
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "Could not grant access.");
    } finally {
      setGrantBusy(false);
    }
  }

  return (
    <PageShell>
      <div className="fixed right-2 top-2 z-[80] flex flex-nowrap items-center gap-2 sm:right-5 sm:top-5 md:right-8 md:top-6">
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
          <div className="mb-12 grid grid-cols-2 gap-6 border-y border-gold/15 py-8 sm:grid-cols-5">
            {[
              { label: "Exams", value: summary.examCount },
              { label: "Published", value: summary.publishedCount },
              { label: "Submissions", value: summary.studentSubmissionCount },
              { label: "Avg marks", value: summary.averageMarks },
              { label: "Subscribers", value: subscriberCount },
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

        <section id="subscribers" className="mb-14">
          <h2 className="font-display text-2xl font-semibold text-champagne">Subscribed students</h2>
          <p className="mt-1 text-sm text-bronze">
            Students who paid ₹2000 (or were granted access) and can take all mock tests.
          </p>

          <Card className="mt-5 overflow-hidden">
            <form
              onSubmit={grantAccess}
              className="flex flex-col gap-3 border-b border-gold/10 bg-charcoal/40 px-5 py-4 sm:flex-row sm:items-end"
            >
              <label className="min-w-0 flex-1 text-xs text-bronze">
                Grant access by email
                <input
                  type="email"
                  required
                  value={grantEmail}
                  onChange={(ev) => setGrantEmail(ev.target.value)}
                  placeholder="student@email.com"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-paper px-3 py-2.5 text-sm text-mist outline-none focus:border-gold/50"
                />
              </label>
              <Button type="submit" disabled={grantBusy || !grantEmail.trim()}>
                {grantBusy ? "Granting…" : "Unlock student"}
              </Button>
            </form>
            <div className="px-5 py-3">
              <ErrorBanner message={grantError} />
              {grantMsg && <p className="mb-3 text-sm text-emerald-200">{grantMsg}</p>}
            </div>

            {loading && subscribers.length === 0 ? (
              <div className="px-5 pb-5">
                <Spinner />
              </div>
            ) : subscribers.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-bronze">
                No subscribers yet. When a student pays ₹2000, they appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-paper/40 text-left text-xs text-gold">
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Class</th>
                      <th className="px-4 py-3 font-semibold">Paid</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((s) => (
                      <tr key={s.id} className="border-t border-gold/10">
                        <td className="px-5 py-3.5 font-medium text-mist">{s.name}</td>
                        <td className="px-4 py-3.5 text-bronze">{s.email}</td>
                        <td className="px-4 py-3.5 text-bronze">
                          {s.className || "—"}
                          {s.rollNumber ? ` · ${s.rollNumber}` : ""}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-bronze">
                          {s.subscriptionPaidAt
                            ? new Date(s.subscriptionPaidAt).toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-gold">
                          <span className="mr-2">
                            {s.subscriptionAmountInr != null
                              ? `₹${s.subscriptionAmountInr}`
                              : "—"}
                          </span>
                          {s.subscriptionPaymentId?.startsWith("manual_") && (
                            <Badge tone="ink">manual</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        <h2 className="mb-4 font-display text-2xl font-semibold text-champagne">Your exams</h2>

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
                  <Button
                    variant="accent"
                    onClick={() => navigate(`/teacher/exam/${e._id}/video-solutions`)}
                  >
                    Video solutions
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
