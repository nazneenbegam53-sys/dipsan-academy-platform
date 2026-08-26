import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../services/api";
import { User, Role } from "../types";

export type OtpSendResponse = {
  challengeId: string;
  expiresInSeconds: number;
  message?: string;
  devOtp?: string;
  otp?: string;
  needsPhone?: boolean;
  sentTo?: { sms?: boolean; email?: boolean };
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  sendRegisterOtp: (data: {
    name: string;
    phone: string;
    role: Role;
    password: string;
    className?: string;
    rollNumber?: string;
  }) => Promise<OtpSendResponse>;
  verifyRegisterOtp: (challengeId: string, otp: string, password: string) => Promise<void>;
  sendSetPasswordOtp: (phone: string) => Promise<OtpSendResponse>;
  verifySetPasswordOtp: (challengeId: string, otp: string, password: string) => Promise<string>;
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

  async function login(phone: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { phone, password });
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function sendRegisterOtp(data: {
    name: string;
    phone: string;
    role: Role;
    password: string;
    className?: string;
    rollNumber?: string;
  }) {
    return api.post<OtpSendResponse>("/auth/otp/register/send", data);
  }

  async function verifyRegisterOtp(challengeId: string, otp: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/auth/otp/register/verify", {
      challengeId,
      otp,
      password,
    });
    localStorage.setItem("dipsan_token", res.token);
    setUser(res.user);
  }

  async function sendSetPasswordOtp(phone: string) {
    return api.post<OtpSendResponse>("/auth/otp/password/send", { phone });
  }

  async function verifySetPasswordOtp(challengeId: string, otp: string, password: string) {
    const res = await api.post<{ message?: string }>("/auth/otp/password/verify", {
      challengeId,
      otp,
      password,
    });
    return res.message || "Password saved. Log in with your mobile number and password.";
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
        login,
        sendRegisterOtp,
        verifyRegisterOtp,
        sendSetPasswordOtp,
        verifySetPasswordOtp,
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
