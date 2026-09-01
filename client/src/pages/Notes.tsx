import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Note } from "../types";
import { Button, ErrorBanner, Spinner, PageShell, AppHeader, Badge } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { NotificationBell } from "../components/NotificationBell";
import { SupportButton } from "../components/SupportButton";
import { resolveMediaUrl } from "../lib/mediaUrl";

const NOTE_SUBJECTS = ["Physics", "Chemistry", "Math", "Biology"] as const;
type NoteSubject = (typeof NOTE_SUBJECTS)[number];

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pdfHref(note: Note, download = false) {
  const url = resolveMediaUrl(note.fileUrl) || note.fileUrl;
  if (!download) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set("download", "1");
    return parsed.toString();
  } catch {
    return url;
  }
}

function noteSubject(note: Note): NoteSubject | "" {
  const s = (note.subject || "").trim();
  return (NOTE_SUBJECTS as readonly string[]).includes(s) ? (s as NoteSubject) : "";
}

export default function Notes() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const home = isTeacher ? "/teacher" : "/student";
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<NoteSubject>("Physics");
  const [filter, setFilter] = useState<NoteSubject>("Physics");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<{ notes: Note[] }>("/notes")
      .then((r) => setNotes(r.notes || []))
      .catch((err) => setError(err.message || "Could not load notes."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const next: Record<NoteSubject, number> = { Physics: 0, Chemistry: 0, Math: 0, Biology: 0 };
    for (const n of notes) {
      const s = noteSubject(n);
      if (s) next[s] += 1;
    }
    return next;
  }, [notes]);

  const visible = notes.filter((n) => noteSubject(n) === filter);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Give the notes a title.");
      return;
    }
    if (!file) {
      setError("Choose a PDF file.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const uploaded = await api.post<{
        url: string;
        provider: string;
        originalName?: string;
        size?: number;
      }>("/upload/pdf", fd);
      await api.post("/notes", {
        title: title.trim(),
        subject,
        fileUrl: uploaded.url,
        provider: uploaded.provider,
        originalName: uploaded.originalName || file.name,
        size: uploaded.size || file.size,
      });
      setTitle("");
      setFile(null);
      setFilter(subject);
      load();
    } catch (err: any) {
      setError(err.message || "Could not upload notes.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      await api.del(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err: any) {
      setError(err.message || "Could not delete notes.");
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-gold/25 bg-charcoal px-3.5 py-3 text-sm text-mist outline-none transition placeholder:text-bronze/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

  return (
    <PageShell>
      <div className="fixed right-2 top-2 z-[80] flex flex-nowrap items-center gap-2 sm:right-5 sm:top-5 md:right-8 md:top-6">
        <NotificationBell />
        <SupportButton />
        <BrandLogo size="sm" glow spinRing />
      </div>

      <div className="mx-auto max-w-5xl animate-fade-up px-6 py-10 pr-20">
        <AppHeader
          title="Notes"
          subtitle={
            isTeacher
              ? "Upload PDFs by subject. Students open them from Notes."
              : "Choose a subject to open PDFs your teachers have shared."
          }
          actions={
            <Link to={home}>
              <Button variant="ghost">Back to dashboard</Button>
            </Link>
          }
        />

        <ErrorBanner message={error} />

        {isTeacher && (
          <form onSubmit={handleUpload} className="mb-12 space-y-3.5 rounded-2xl border border-gold/20 bg-ink/40 p-5">
            <h2 className="font-display text-xl font-semibold text-champagne">Upload PDF</h2>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClass}
              placeholder="Title (e.g. Electrostatics revision)"
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
                Subject
              </span>
              <select
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value as NoteSubject)}
                className={fieldClass}
              >
                {NOTE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-bronze">
                PDF file (max 25 MB)
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink"
              />
              {file && <p className="mt-2 text-xs text-bronze">{file.name}</p>}
            </label>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload notes"}
            </Button>
          </form>
        )}

        <section>
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-gold/20 bg-ink/60 p-1 sm:grid-cols-4">
            {NOTE_SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  filter === s ? "bg-gold text-ink" : "text-bronze hover:text-champagne"
                }`}
              >
                {s}
                <span className={`ml-1 text-xs ${filter === s ? "text-ink/70" : "text-bronze/80"}`}>
                  ({counts[s]})
                </span>
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-semibold text-champagne">{filter} notes</h2>
          {loading ? (
            <div className="mt-8">
              <Spinner />
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-8 border-t border-gold/15 pt-8 text-sm text-bronze">
              No {filter.toLowerCase()} notes yet.
            </p>
          ) : (
            <ul className="mt-8 divide-y divide-gold/10 border-y border-gold/15">
              {visible.map((n, i) => (
                <li
                  key={n._id}
                  className="flex animate-fade-up flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div>
                    <Badge tone="marigold">{noteSubject(n) || filter}</Badge>
                    <div className="mt-2 font-display text-xl font-semibold text-mist">{n.title}</div>
                    <div className="mt-1 text-xs text-bronze">
                      {n.teacherName ? `${n.teacherName} · ` : ""}
                      {new Date(n.createdAt).toLocaleString()}
                      {n.size ? ` · ${formatSize(n.size)}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={pdfHref(n)} target="_blank" rel="noreferrer">
                      <Button type="button">Open PDF</Button>
                    </a>
                    {isTeacher && (
                      <>
                        <a href={pdfHref(n, true)} target="_blank" rel="noreferrer">
                          <Button type="button" variant="ghost">
                            Download
                          </Button>
                        </a>
                        <Button variant="danger" onClick={() => handleDelete(n._id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
