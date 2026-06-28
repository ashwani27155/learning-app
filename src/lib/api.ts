export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

// ── Token storage ──────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("accessToken",  access);
  localStorage.setItem("refreshToken", refresh);
};
export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  clearTestProgress();
};

// Per-test attempt progress (attemptId_<testId>, submittedTest_<testId>, demoResult_<testId>_<attemptId>)
// is keyed only by testId, not by user. If a different account logs in on the same browser,
// it would otherwise inherit the previous user's stale/foreign attempt id for the same test.
export const clearTestProgress = () => {
  const prefixes = ["attemptId_", "submittedTest_", "demoResult_"];
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && prefixes.some(p => key.startsWith(p))) localStorage.removeItem(key);
  }
};

// ── Core fetch wrapper ─────────────────────────────────────────────────────────
interface RequestOptions extends RequestInit {
  auth?:   boolean;                      // attach Authorization header (default: true)
  raw?:    boolean;                      // return raw Response instead of parsed JSON
  params?: Record<string, string | number | boolean | undefined>; // query string params
}

export class ApiError extends Error {
  constructor(
    public readonly status:  number,
    public readonly message: string,
    public readonly code?:   string,
  ) {
    super(message);
  }
}

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError(401, "No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) {
    clearTokens();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  const data = await res.json();
  setTokens(data.data.accessToken, data.data.refreshToken);
  return data.data.accessToken;
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, raw = false, params, ...init } = options;

  // Append query params to path if provided
  let fullPath = path;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) fullPath = `${path}${path.includes("?") ? "&" : "?"}${qs}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${fullPath}`, { ...init, headers });

  // Auto-refresh on 401
  if (res.status === 401 && auth && !path.includes("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];

        const retryRes = await fetch(`${BASE_URL}${fullPath}`, {
          ...init,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        });
        const retryData = await retryRes.json();
        if (!retryRes.ok) throw new ApiError(retryRes.status, retryData.message, retryData.code);
        return retryData.data ?? retryData;
      } catch (err) {
        refreshQueue.forEach(({ reject }) => reject(err));
        refreshQueue = [];
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push({
          resolve: async (newToken) => {
            try {
              const retryRes = await fetch(`${BASE_URL}${fullPath}`, {
                ...init,
                headers: { ...headers, Authorization: `Bearer ${newToken}` },
              });
              const retryData = await retryRes.json();
              if (!retryRes.ok) {
                reject(new ApiError(retryRes.status, retryData.message, retryData.code));
              } else {
                resolve(retryData.data ?? retryData);
              }
            } catch (e) { reject(e); }
          },
          reject,
        });
      });
    }
  }

  if (raw) return res as unknown as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.message ?? "Request failed", data.code);
  }

  return (data.data ?? data) as T;
}

// ── Convenience methods ────────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string, opts?: RequestOptions)              => request<T>(path, { ...opts, method: "GET" }),
  post:   <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "POST",  body: body ? JSON.stringify(body) : undefined }),
  put:    <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PUT",   body: body ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>(path, { ...opts, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, opts?: RequestOptions)              => request<T>(path, { ...opts, method: "DELETE" }),
};
