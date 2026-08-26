import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../services/api";
import { User, Role } from "../types";

export type OtpSendResponse = {
  challengeId: string;
  expiresInSeconds: number;
  message?: string;
  devOtp?: string;
  sentTo?: { email: boolean; whatsapp: boolean };
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    className?: string;
    rollNumber?: string;
    phone?: string;
  }) => Promise<void>;
  sendRegisterOtp: (data: {
    name: string;
    email: string;
    phone: string;
    role: Role;
    className?: string;
    rollNumber?: string;
  }) => Promise<OtpSendResponse>;
  verifyRegisterOtp: (challengeId: string, otp: string) => Promise<void>;
  sendLoginOtp: (identifier: string) => Promise<OtpSendResponse>;
  verifyLoginOtp: (challengeId: string, otp: string) => Promise<void>;
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

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function register(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    className?: string;
    rollNumber?: string;
    phone?: string;
  }) {
    const res = await api.post<{ token: string; user: User }>("/auth/register", data);
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function sendRegisterOtp(data: {
    name: string;
    email: string;
    phone: string;
    role: Role;
    className?: string;
    rollNumber?: string;
  }) {
    return api.post<OtpSendResponse>("/auth/otp/register/send", data);
  }

  async function verifyRegisterOtp(challengeId: string, otp: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/otp/register/verify", {
      challengeId,
      otp,
    });
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function sendLoginOtp(identifier: string) {
    return api.post<OtpSendResponse>("/auth/otp/login/send", { identifier });
  }

  async function verifyLoginOtp(challengeId: string, otp: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/otp/login/verify", {
      challengeId,
      otp,
    });
    localStorage.setItem("dipsan_token", res.token);
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
        sendRegisterOtp,
        verifyRegisterOtp,
        sendLoginOtp,
        verifyLoginOtp,
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
