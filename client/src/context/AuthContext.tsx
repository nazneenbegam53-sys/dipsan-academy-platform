import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../services/api";
import { User, Role } from "../types";

export type OtpSendResponse = {
  challengeId: string;
  expiresInSeconds: number;
  message?: string;
  devOtp?: string;
  needsPhone?: boolean;
  sentTo?: { email: boolean; whatsapp: boolean };
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
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
  sendLinkPhoneOtp: (phone: string) => Promise<OtpSendResponse>;
  verifyLinkPhoneOtp: (challengeId: string, otp: string) => Promise<void>;
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

  async function sendLinkPhoneOtp(phone: string) {
    return api.post<OtpSendResponse>("/auth/otp/phone/send", { phone });
  }

  async function verifyLinkPhoneOtp(challengeId: string, otp: string) {
    const res = await api.post<{ user: User; message?: string }>("/auth/otp/phone/verify", {
      challengeId,
      otp,
    });
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
        sendRegisterOtp,
        verifyRegisterOtp,
        sendLoginOtp,
        verifyLoginOtp,
        sendLinkPhoneOtp,
        verifyLinkPhoneOtp,
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
