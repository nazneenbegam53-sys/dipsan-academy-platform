import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Board, Classroom } from "../types";
import { boardApi, classroomApi } from "../services/classroomApi";
import { Button, ErrorBanner, Spinner, PageShell, AppHeader, Badge, Card } from "../components/ui";

export default function ClassroomHub() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher";

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [boardTitle, setBoardTitle] = useState("Live whiteboard");

  function loadClassrooms(preferId?: string) {
    setLoading(true);
    setError("");
    classroomApi
      .list()
      .then((r) => {
        const list = r.classrooms || [];
        setClassrooms(list);
        const next =
          preferId && list.some((c) => c._id === preferId)
            ? preferId
            : selectedId && list.some((c) => c._id === selectedId)
              ? selectedId
              : list[0]?._id || null;
        setSelectedId(next);
      })
      .catch((err: Error) => setError(err.message || "Could not load classrooms."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadClassrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setBoards([]);
      return;
    }
    setBoardsLoading(true);
    boardApi
      .list(selectedId)
      .then((r) => setBoards(r.boards || []))
      .catch((err: Error) => setError(err.message || "Could not load boards."))
      .finally(() => setBoardsLoading(false));
  }, [selectedId]);

  const selected = classrooms.find((c) => c._id === selectedId) || null;
  const teacherId =
    selected && typeof selected.teacher === "object" ? selected.teacher._id : selected?.teacher;
  const isOwner = Boolean(teacherId && user?.id && String(teacherId) === String(user.id));

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const { classroom } = await classroomApi.create("DIPSAN ACADEMY CLASSROOM");
      loadClassrooms(classroom._id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create classroom.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setError("");
    try {
      const { classroom } = await classroomApi.join(joinCode.trim().toUpperCase());
      setJoinCode("");
      loadClassrooms(classroom._id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not join classroom.");
    } finally {
      setJoining(false);
    }
  }

  async function handleCreateBoard() {
    if (!selectedId) return;
    setError("");
    try {
      const { board } = await boardApi.create(selectedId, boardTitle.trim() || "Whiteboard");
      setBoardTitle("Live whiteboard");
      navigate(`/classroom/board/${board._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create board.");
    }
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl animate-fade-up px-6 py-10">
        <AppHeader
          title="DIPSAN ACADEMY CLASSROOM"
          subtitle="Live collaborative whiteboard sessions"
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

        <ErrorBanner message={error} />

        <div className="mb-10 flex flex-col gap-4 border-y border-gold/15 py-6 sm:flex-row sm:items-end sm:justify-between">
          {isTeacher && (
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "+ Create classroom"}
            </Button>
          )}
          <form onSubmit={handleJoin} className="flex flex-wrap items-end gap-2">
            <label className="block text-xs text-bronze">
              Join with code
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="mt-1 block w-36 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm tracking-widest text-mist outline-none focus:border-gold/50"
              />
            </label>
            <Button type="submit" variant="ghost" disabled={joining || joinCode.trim().length < 6}>
              {joining ? "Joining…" : "Join"}
            </Button>
          </form>
        </div>

        {loading ? (
          <Spinner />
        ) : classrooms.length === 0 ? (
          <p className="text-sm text-bronze">
            {isTeacher
              ? "Create a classroom to share a join code with students."
              : "Ask your teacher for a 6-character join code."}
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-bronze">
                Your classrooms
              </h2>
              <ul className="space-y-2">
                {classrooms.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c._id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        c._id === selectedId
                          ? "border-gold/40 bg-gold/10 text-champagne"
                          : "border-white/10 bg-white/5 text-mist hover:border-white/20"
                      }`}
                    >
                      <div className="font-semibold leading-snug">{c.name}</div>
                      <div className="mt-1 font-mono text-[11px] text-bronze">{c.joinCode}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section>
              {selected && (
                <>
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-semibold text-champagne">
                      {selected.name}
                    </h2>
                    <Badge tone="marigold">Code {selected.joinCode}</Badge>
                    <Badge>
                      {selected.members?.length || 0} member
                      {(selected.members?.length || 0) === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {isOwner && (
                    <Card className="mb-8 p-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="block flex-1 text-xs text-bronze">
                          New board title
                          <input
                            value={boardTitle}
                            onChange={(e) => setBoardTitle(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-mist outline-none focus:border-gold/50"
                          />
                        </label>
                        <Button onClick={handleCreateBoard}>+ Open whiteboard</Button>
                      </div>
                    </Card>
                  )}

                  <h3 className="mb-3 font-display text-lg text-mist">Boards</h3>
                  {boardsLoading ? (
                    <Spinner />
                  ) : boards.length === 0 ? (
                    <p className="text-sm text-bronze">
                      {isOwner
                        ? "Create a whiteboard to start a live session."
                        : "No boards yet — wait for your teacher to open one."}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gold/10 border-y border-gold/15">
                      {boards.map((b) => (
                        <li
                          key={b._id}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="font-semibold text-mist">{b.title}</div>
                            <div className="mt-1 text-xs text-bronze">
                              {b.pages?.length || 1} page{(b.pages?.length || 1) === 1 ? "" : "s"}
                              {b.liveEnded
                                ? " · class ended"
                                : b.studentEditingLocked
                                  ? " · students locked"
                                  : " · students can draw"}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => navigate(`/classroom/board/${b._id}`)}>
                              {b.liveEnded ? "View board" : "Enter board"}
                            </Button>
                            {isOwner && b.liveEnded && (
                              <Button
                                onClick={async () => {
                                  try {
                                    await boardApi.reopenClass(b._id);
                                    if (!selectedId) return;
                                    const list = await boardApi.list(selectedId);
                                    setBoards(list.boards || []);
                                  } catch {
                                    /* ignore */
                                  }
                                }}
                              >
                                Reopen class
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </PageShell>
  );
}
