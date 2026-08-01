import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { api } from "../services/api";
import { Attempt, Exam } from "../types";
import { Card, Spinner, Button, Badge } from "../components/ui";

export default function ResultPage() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ attempt: Attempt; exam: Exam }>(`/attempts/${attemptId}/result`)
      .then((r) => { setAttempt(r.attempt); setExam(r.exam); })
      .finally(() => setLoading(false));
  }, [attemptId]);

  function downloadScorecard() {
    if (!attempt || !exam) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("Dipsan Academy — Scorecard", 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Exam: ${exam.title}`, 14, y); y += 7;
    doc.text(`Score: ${attempt.score} / ${attempt.totalMarks}`, 14, y); y += 7;
    doc.text(`Correct: ${attempt.correctCount}   Wrong: ${attempt.wrongCount}   Unattempted: ${attempt.unattemptedCount}`, 14, y); y += 7;
    doc.text(`Submitted: ${attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}`, 14, y); y += 12;

    exam.questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      //const entry = attempt.answers?.[q._id];
      const answers = attempt.answers || {};
      const entry = answers[q._id];
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(`Q${i + 1}. ${q.text}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 6;
      const correctLetter = q.correctOptionIndex !== null && q.correctOptionIndex !== undefined ? "ABCD"[q.correctOptionIndex] : "—";
      const yourLetter = entry?.selected !== undefined && entry?.selected !== null ? "ABCD"[Number(entry.selected)] : "Not attempted";
      doc.setFontSize(10);
      doc.text(`Correct answer: ${correctLetter}   Your answer: ${yourLetter}`, 14, y);
      y += 9;
    });

    doc.save(`${exam.title.replace(/\s+/g, "-")}-scorecard.pdf`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!attempt || !exam) return <div className="min-h-screen flex items-center justify-center text-sm text-bronze">Result not found.</div>;

  const pct = attempt.totalMarks ? Math.round(((attempt.score || 0) / attempt.totalMarks) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <Badge tone="ink">RESULT</Badge>
          <div className="font-display text-5xl font-semibold text-gold mt-4">
            {attempt.score}<span className="text-bronze text-2xl"> / {attempt.totalMarks}</span>
          </div>
          <div className="text-sm text-bronze mt-1">{pct}% &middot; {exam.title}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-7">
          <Card className="p-4 bg-teal/10 border border-gold/10 border-none text-center">
            <div className="text-xs text-green-700">CORRECT</div>
            <div className="text-xl font-bold text-green-700">{attempt.correctCount}</div>
          </Card>
          <Card className="p-4 bg-ember/15 border-none text-center">
            <div className="text-xs text-red-700">WRONG</div>
            <div className="text-xl font-bold text-red-700">{attempt.wrongCount}</div>
          </Card>
          <Card className="p-4 bg-ink border border-gold/20 border-none text-center">
            <div className="text-xs text-bronze">UNATTEMPTED</div>
            <div className="text-xl font-bold text-bronze">{attempt.unattemptedCount}</div>
          </Card>
        </div>

        <div className="flex justify-center mb-8">
          <Button variant="accent" onClick={downloadScorecard}>Download Scorecard (PDF)</Button>
        </div>

        <h2 className="font-semibold text-champagne mb-3">Answer review</h2>
        <div className="space-y-4">
          {exam.questions.map((q, i) => {
            //const entry = attempt.answers[q._id];
            const answers = attempt.answers || {};
            const entry = answers[q._id];
            const selected = entry?.selected;
            return (
              <Card key={q._id} className="p-5">
                <div className="text-xs text-orange-600 font-mono mb-2">QUESTION {i + 1}</div>
                <div className="text-sm font-medium text-champagne mb-3">{q.text}</div>
                {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-64 rounded-lg mb-3 border border-gold/20" />}
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    let cls = "border border-gold/25";
                    if (oi === q.correctOptionIndex) cls = "border border-green-500 bg-teal/10 border border-gold/10";
                    if (selected === oi && oi !== q.correctOptionIndex) cls = "border border-red-500 bg-ember/15";
                    return (
                      <div key={oi} className={`rounded-lg px-3 py-2 text-sm ${cls}`}>
                        <span className="font-semibold mr-1.5">{"ABCD"[oi]}.</span>{opt}
                      </div>
                    );
                  })}
                  {(selected === undefined || selected === null) && <div className="text-xs text-bronze/70">Not attempted</div>}
                </div>
                {q.explanation && (
                  <div className="mt-3 text-xs rounded-sm px-3 py-2 bg-charcoal border-l-4 border-gold text-bronze">
                    <span className="font-semibold">Explanation: </span>{q.explanation}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
