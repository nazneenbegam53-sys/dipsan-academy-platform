import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { api } from "../services/api";
import { Attempt, Exam, Question } from "../types";
import { Card, Spinner, Button, Badge, PageShell } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const format = blob.type.includes("png") || dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    return { dataUrl, format };
  } catch {
    return null;
  }
}

function fitImage(doc: jsPDF, dataUrl: string, format: "PNG" | "JPEG", y: number, maxW = 120, maxH = 55) {
  const props = doc.getImageProperties(dataUrl);
  const ratio = Math.min(maxW / props.width, maxH / props.height);
  const w = props.width * ratio;
  const h = props.height * ratio;
  if (y + h > 280) {
    doc.addPage();
    y = 20;
  }
  doc.addImage(dataUrl, format, 14, y, w, h);
  return y + h + 6;
}

export default function ResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .get<{ attempt: Attempt; exam: Exam }>(`/attempts/${attemptId}/result`)
      .then((r) => {
        setAttempt(r.attempt);
        setExam(r.exam);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Could not load result.");
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  async function downloadScorecard() {
    if (!attempt || !exam) return;
    setPdfBusy(true);
    try {
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(18);
      doc.text("Dipsan Academy — Scorecard", 14, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Exam: ${exam.title}`, 14, y);
      y += 7;
      doc.text(`Score: ${attempt.score} / ${attempt.totalMarks}`, 14, y);
      y += 7;
      doc.text(
        `Correct: ${attempt.correctCount}   Wrong: ${attempt.wrongCount}   Unattempted: ${attempt.unattemptedCount}`,
        14,
        y
      );
      y += 7;
      doc.text(
        `Submitted: ${attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}`,
        14,
        y
      );
      y += 12;

      for (let i = 0; i < exam.questions.length; i++) {
        const q = exam.questions[i];
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        const answers = attempt.answers || {};
        const entry = answers[q._id];
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(`Q${i + 1}. ${q.text}`, 180);
        doc.text(lines, 14, y);
        y += lines.length * 6;

        if (q.imageUrl) {
          const img = await loadImageDataUrl(q.imageUrl);
          if (img) {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Question image:", 14, y);
            y += 4;
            doc.setTextColor(0);
            y = fitImage(doc, img.dataUrl, img.format, y);
          }
        }

        const correctLetter =
          q.correctOptionIndex !== null && q.correctOptionIndex !== undefined
            ? "ABCD"[q.correctOptionIndex]
            : "—";
        const yourLetter =
          entry?.selected !== undefined && entry?.selected !== null
            ? "ABCD"[Number(entry.selected)]
            : "Not attempted";
        doc.setFontSize(10);
        doc.text(`Correct answer: ${correctLetter}   Your answer: ${yourLetter}`, 14, y);
        y += 7;

        if (q.explanation) {
          const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, 180);
          if (y + expLines.length * 5 > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(9);
          doc.text(expLines, 14, y);
          y += expLines.length * 5 + 2;
        }

        if (q.explanationImageUrl) {
          const img = await loadImageDataUrl(q.explanationImageUrl);
          if (img) {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Solution image:", 14, y);
            y += 4;
            doc.setTextColor(0);
            y = fitImage(doc, img.dataUrl, img.format, y);
          }
        }

        y += 4;
      }

      doc.save(
        `${exam.subject.replace(/\s+/g, "-")}-${exam.title.replace(/\s+/g, "-")}-scorecard.pdf`
      );
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center">
        <Spinner />
      </PageShell>
    );
  }
  if (!attempt || !exam) {
    return (
      <PageShell className="flex min-h-screen items-center justify-center text-sm text-bronze">
        {loadError || "Result not found."}
      </PageShell>
    );
  }

  const pct = attempt.totalMarks
    ? Math.round(((attempt.score || 0) / attempt.totalMarks) * 100)
    : 0;

  return (
    <PageShell>
      <div className="fixed right-5 top-5 z-20 md:right-8 md:top-6">
        <BrandLogo size="xs" rounded />
      </div>
      <div className="mx-auto max-w-3xl animate-fade-up px-6 py-10 pr-20">
        <div className="mb-6 text-center">
          <Badge tone="ink">RESULT</Badge>
          <div className="mt-4 font-display text-5xl font-semibold text-mist">
            {attempt.score}
            <span className="text-2xl text-bronze"> / {attempt.totalMarks}</span>
          </div>
          <div className="mt-1 text-sm text-bronze">
            {pct}% · {exam.title}
          </div>
        </div>

        <div className="mb-7 grid grid-cols-3 gap-3">
          <Card className="border border-emerald-400/40 bg-emerald-500/15 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Correct
            </div>
            <div className="mt-1 text-xl font-bold text-emerald-200">{attempt.correctCount}</div>
          </Card>
          <Card className="border border-red-400/40 bg-red-500/15 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-300">Wrong</div>
            <div className="mt-1 text-xl font-bold text-red-200">{attempt.wrongCount}</div>
          </Card>
          <Card className="border border-white/15 bg-white/5 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-bronze">
              Unattempted
            </div>
            <div className="mt-1 text-xl font-bold text-mist">{attempt.unattemptedCount}</div>
          </Card>
        </div>

        <div className="mb-8 flex justify-center">
          <Button variant="accent" onClick={downloadScorecard} disabled={pdfBusy}>
            {pdfBusy ? "Building PDF…" : "Download Scorecard (PDF)"}
          </Button>
        </div>

        <h2 className="mb-3 font-semibold text-mist">Answer review</h2>
        <div className="space-y-4">
          {exam.questions.map((q: Question, i) => {
            const answers = attempt.answers || {};
            const entry = answers[q._id];
            const selected = entry?.selected;
            return (
              <Card key={q._id} className="animate-fade-up p-5" style={{ animationDelay: `${i * 0.04}s` } as React.CSSProperties}>
                <div className="mb-2 font-mono text-xs text-orange-600">QUESTION {i + 1}</div>
                <div className="mb-3 text-sm font-medium text-mist">{q.text}</div>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="mb-3 max-h-64 rounded-lg border border-gold/10"
                  />
                )}
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.correctOptionIndex;
                    const isWrongPick =
                      selected === oi && oi !== q.correctOptionIndex;
                    let cls =
                      "border border-white/15 bg-white/5 text-mist";
                    let label = "";
                    if (isCorrect) {
                      cls =
                        "border border-emerald-400/70 bg-emerald-500/20 text-emerald-100";
                      label = "Correct";
                    }
                    if (isWrongPick) {
                      cls = "border border-red-400/70 bg-red-500/20 text-red-100";
                      label = "Your answer";
                    }
                    return (
                      <div
                        key={oi}
                        className={`flex flex-wrap items-center rounded-lg px-3 py-2.5 text-sm ${cls}`}
                      >
                        <span className="mr-1.5 font-semibold">{"ABCD"[oi]}.</span>
                        <span className="flex-1">{opt}</span>
                        {label && (
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              isWrongPick
                                ? "bg-red-400/25 text-red-200"
                                : "bg-emerald-400/25 text-emerald-200"
                            }`}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(selected === undefined || selected === null) && (
                    <div className="text-xs text-bronze">Not attempted</div>
                  )}
                </div>
                {(q.explanation || q.explanationImageUrl || q.explanationVideoUrl) && (
                  <div className="mt-3 space-y-3 rounded-xl border-l-4 border-gold bg-gold/10 px-3 py-2 text-xs text-champagne/80">
                    {q.explanation && (
                      <div>
                        <span className="font-semibold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                    {q.explanationImageUrl && (
                      <img
                        src={q.explanationImageUrl}
                        alt="Solution"
                        className="mt-2 max-h-56 rounded-lg border border-gold/10"
                      />
                    )}
                    {q.explanationVideoUrl && q.explanationVideoStatus === "published" && (
                      <div className="mt-2">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                          Video solution
                        </p>
                        <video
                          src={q.explanationVideoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="aspect-video w-full max-w-xl rounded-xl border border-gold/20 bg-black"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
