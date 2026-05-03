export interface Application {
  id: string;
  displayName: string;
  applicationUrl: string;
  redirectUrl: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers as Record<string, string> ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, ...(body as object) };
  }
  return res.json() as Promise<T>;
}

// Auth
export const signIn = (body: {
  email: string;
  password: string;
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}) =>
  request<{ token?: string; redirect?: string; error?: string; message?: string }>(
    "/o/authenticate/sign-in",
    { method: "POST", body: JSON.stringify(body) }
  );

export const signUp = (body: {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}) =>
  request<{ ok: boolean; emailSent?: boolean }>(
    "/o/authenticate/sign-up",
    { method: "POST", body: JSON.stringify(body) }
  );

export const verifyEmail = (token: string) =>
  request<{ ok: boolean }>(`/o/verify-email?token=${token}`);

export const resendVerification = (email: string) =>
  request<{ ok: boolean }>("/o/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const forgotPassword = (email: string) =>
  request<{ ok: boolean }>("/o/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const validateResetToken = (token: string) =>
  request<{ ok: boolean }>(`/o/reset-password/validate?token=${token}`);

export const resetPassword = (token: string, password: string) =>
  request<{ ok: boolean }>("/o/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

// Applications
export const getApplications = () =>
  request<Application[]>("/applications");

export const getApplication = (clientId: string) =>
  request<Application>(`/applications/${clientId}`);

export const createApplication = (body: {
  displayName: string;
  applicationUrl: string;
  redirectUrl: string;
}) =>
  request<Application & { clientSecret: string }>("/applications", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateApplication = (
  clientId: string,
  body: { displayName?: string; applicationUrl?: string; redirectUrl?: string }
) =>
  request<Application>(`/applications/${clientId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteApplication = (clientId: string) =>
  fetch(`/applications/${clientId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
