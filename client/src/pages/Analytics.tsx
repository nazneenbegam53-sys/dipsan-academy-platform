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
  if (!data) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">No data yet.</div>;

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
    <div className="min-h-screen bg-paper px-6 py-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-5">← Dashboard</Button>
      <h1 className="text-xl font-bold text-ink mb-6">Exam Analytics</h1>

      {data.submissionCount === 0 ? (
        <Card className="p-10 text-center text-sm text-gray-500">No submissions yet — analytics will populate once students take the test.</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            <Card className="p-4"><div className="text-xs text-gray-500">SUBMISSIONS</div><div className="text-lg font-bold text-ink">{data.submissionCount}</div></Card>
            <Card className="p-4"><div className="text-xs text-gray-500">AVERAGE</div><div className="text-lg font-bold text-ink">{data.averageScore}</div></Card>
            <Card className="p-4"><div className="text-xs text-gray-500">HIGHEST</div><div className="text-lg font-bold text-ink">{data.highestScore}</div></Card>
            <Card className="p-4"><div className="text-xs text-gray-500">LOWEST</div><div className="text-lg font-bold text-ink">{data.lowestScore}</div></Card>
            <Card className="p-4"><div className="text-xs text-gray-500">PASS %</div><div className="text-lg font-bold text-ink">{data.passPercentage}%</div></Card>
          </div>

          <Card className="p-6 mb-8">
            <div className="font-semibold text-ink mb-4">Question-wise accuracy</div>
            <Bar data={chartData} options={{ responsive: true, scales: { y: { min: 0, max: 100 } } }} />
          </Card>

          <Card className="p-6">
            <div className="font-semibold text-ink mb-4">Most difficult questions</div>
            <div className="space-y-2">
              {[...data.questionAccuracy].sort((a, b) => a.accuracyPercent - b.accuracyPercent).slice(0, 5).map((q, i) => (
                <div key={q.questionId} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-ink">{q.text}</span>
                  <span className="font-mono text-orange-600">{q.accuracyPercent}%</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
