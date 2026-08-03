import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import InstallApp from "./pages/InstallApp";
import StudentDashboard from "./pages/StudentDashboard";
import ExamInstructions from "./pages/ExamInstructions";
import ExamAttempt from "./pages/ExamAttempt";
import ResultPage from "./pages/ResultPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import ExamEditor from "./pages/ExamEditor";
import TeacherResults from "./pages/TeacherResults";
import Analytics from "./pages/Analytics";
import VideoSolutions from "./pages/VideoSolutions";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/install" element={<InstallApp />} />

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/exam/:examId/instructions" element={<ProtectedRoute role="student"><ExamInstructions /></ProtectedRoute>} />
      <Route path="/student/exam/:examId/attempt/:attemptId" element={<ProtectedRoute role="student"><ExamAttempt /></ProtectedRoute>} />
      <Route path="/student/result/:attemptId" element={<ProtectedRoute role="student"><ResultPage /></ProtectedRoute>} />

      {/* Teacher */}
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/results" element={<ProtectedRoute role="teacher"><TeacherResults /></ProtectedRoute>} />
      <Route path="/teacher/exam/new" element={<ProtectedRoute role="teacher"><ExamEditor /></ProtectedRoute>} />
      <Route path="/teacher/exam/:examId/edit" element={<ProtectedRoute role="teacher"><ExamEditor /></ProtectedRoute>} />
      <Route path="/teacher/exam/:examId/results" element={<ProtectedRoute role="teacher"><TeacherResults /></ProtectedRoute>} />
      <Route path="/teacher/exam/:examId/analytics" element={<ProtectedRoute role="teacher"><Analytics /></ProtectedRoute>} />
      <Route path="/teacher/exam/:examId/video-solutions" element={<ProtectedRoute role="teacher"><VideoSolutions /></ProtectedRoute>} />
    </Routes>
  );
}
