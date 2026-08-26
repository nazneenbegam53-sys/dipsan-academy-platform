import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../services/api";
import { User, Role } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    phone: string;
    role: Role;
    password: string;
    className?: string;
    rollNumber?: string;
  }) => Promise<void>;
  linkPhone: (phone: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserFromServer: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("dipsan_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>("/auth/me")
      .then((res) => setUser(res.user))
      .catch(() => localStorage.removeItem("dipsan_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(phone: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { phone, password });
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function register(data: {
    name: string;
    phone: string;
    role: Role;
    password: string;
    className?: string;
    rollNumber?: string;
  }) {
    const res = await api.post<{ token: string; user: User }>("/auth/register", data);
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function linkPhone(phone: string) {
    const res = await api.post<{ user: User; message?: string }>("/auth/phone", { phone });
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem("dipsan_token");
    setUser(null);
  }

  async function refreshUser() {
    const res = await api.get<{ user: User }>("/auth/me");
    setUser(res.user);
  }

  function setUserFromServer(next: User) {
    setUser(next);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        linkPhone,
        logout,
        refreshUser,
        setUserFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
