const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type RequestOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as any)?.message || "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export type JobOrder = {
  id: number;
  recruiter_id: number;
  title: string;
  company?: string | null;
  description: string | null;
  location: string | null;
  salary_min: string | null;
  salary_max: string | null;
  status: string;
  created_at: string;
};

export const authClient = {
  register: (body: { email: string; password: string; fullName: string; role?: string }) =>
    request<{ user: AuthUser }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: AuthUser }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<{ user: AuthUser }>("/api/auth/me", { method: "GET" }),
  forgot: (email: string) => request<{ message: string; token?: string; expiresAt?: string }>("/api/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  reset: (body: { token: string; password: string }) =>
    request<{ message: string }>("/api/auth/reset", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),
  sendVerification: (email: string) =>
    request<{ message: string }>("/api/auth/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

export const jobsClient = {
  listMine: () => request<{ jobs: JobOrder[] }>("/api/jobs/mine"),
  listAll: () => request<{ jobs: JobOrder[] }>("/api/jobs"),
  create: (body: {
    title: string;
    company?: string;
    description?: string;
    location?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    status?: string;
  }) => request<{ job: JobOrder }>("/api/jobs", { method: "POST", body: JSON.stringify(body) }),
  copy: (body: {
    sourceId: number;
    title?: string;
    company?: string;
    description?: string;
    location?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    status?: string;
  }) => request<{ job: JobOrder }>("/api/jobs/copy", { method: "POST", body: JSON.stringify(body) }),
};

export { API_BASE };
