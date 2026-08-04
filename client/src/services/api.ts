const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

function getToken() {
  return localStorage.getItem("dipsan_token");
}

export class ApiError extends Error {
  status: number;
  code?: string;
  subscribePath?: string;

  constructor(message: string, status: number, code?: string, subscribePath?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.subscribePath = subscribePath;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data.message || `Request failed (${res.status})`,
      res.status,
      data.code,
      data.subscribePath
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_URL, getToken };
