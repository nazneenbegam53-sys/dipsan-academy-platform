import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ClassroomHub from "./pages/ClassroomHub";
import WhiteboardSession from "./pages/WhiteboardSession";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/classroom"
        element={
          <ProtectedRoute>
            <ClassroomHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classroom/board/:boardId"
        element={
          <ProtectedRoute>
            <WhiteboardSession />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
