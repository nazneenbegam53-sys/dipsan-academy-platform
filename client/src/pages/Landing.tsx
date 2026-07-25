import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-ink text-paper text-center">
      <div className="text-xs tracking-widest text-marigold mb-4">MOCK TEST SERIES</div>
      <h1 className="text-5xl font-black mb-3">Dipsan Academy</h1>
      <p className="text-gray-300 mb-10 max-w-md">
        Full-length NEET &amp; JEE mock tests, scored the moment you submit.
      </p>

      {user ? (
        <Link
          to={user.role === "teacher" ? "/teacher" : "/student"}
          className="rounded-full bg-marigold text-ink px-6 py-3 font-semibold"
        >
          Go to your dashboard
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link to="/login" className="rounded-full bg-white text-ink px-6 py-3 font-semibold">
            Log in
          </Link>
          <Link to="/register" className="rounded-full bg-marigold text-ink px-6 py-3 font-semibold">
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
