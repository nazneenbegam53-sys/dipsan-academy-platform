import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { api } from "../services/api";
import { Button, Card, Spinner } from "../components/ui";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsData {
  submissionCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
  averageTimeSeconds: number;
  questionAccuracy: { questionId: string; text: string; chapter?: string; attempted: number; accuracyPercent: number }[];
}

export default function Analytics() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AnalyticsData>(`/analytics/${examId}`).then(setData).finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-sm text-bronze">No data yet.</div>;

  const chartData = {
    labels: data.questionAccuracy.map((_, i) => `Q${i + 1}`),
    datasets: [
      {
        label: "Accuracy %",
        data: data.questionAccuracy.map((q) => q.accuracyPercent),
        backgroundColor: "#E2963A",
      },
    ],
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-4xl bg-paper px-4 py-6 sm:px-6 sm:py-8">
      <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-5">← Dashboard</Button>
      <h1 className="text-xl font-bold text-mist mb-6">Exam Analytics</h1>

      {data.submissionCount === 0 ? (
        <Card className="p-10 text-center text-sm text-bronze">No submissions yet — analytics will populate once students take the test.</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            <Card className="p-4"><div className="text-xs text-bronze">SUBMISSIONS</div><div className="text-lg font-bold text-mist">{data.submissionCount}</div></Card>
            <Card className="p-4"><div className="text-xs text-bronze">AVERAGE</div><div className="text-lg font-bold text-mist">{data.averageScore}</div></Card>
            <Card className="p-4"><div className="text-xs text-bronze">HIGHEST</div><div className="text-lg font-bold text-mist">{data.highestScore}</div></Card>
            <Card className="p-4"><div className="text-xs text-bronze">LOWEST</div><div className="text-lg font-bold text-mist">{data.lowestScore}</div></Card>
            <Card className="p-4"><div className="text-xs text-bronze">PASS %</div><div className="text-lg font-bold text-mist">{data.passPercentage}%</div></Card>
          </div>

          <Card className="mb-8 overflow-hidden p-4 sm:p-6">
            <div className="font-semibold text-mist mb-4">Question-wise accuracy</div>
            <div className="h-64 w-full sm:h-80">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { min: 0, max: 100 } },
                }}
              />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="font-semibold text-mist mb-4">Most difficult questions</div>
            <div className="space-y-2">
              {[...data.questionAccuracy].sort((a, b) => a.accuracyPercent - b.accuracyPercent).slice(0, 5).map((q) => (
                <div key={q.questionId} className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 text-sm">
                  <span className="min-w-0 break-anywhere text-mist">{q.text}</span>
                  <span className="shrink-0 font-mono text-orange-600">{q.accuracyPercent}%</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
