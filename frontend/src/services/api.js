const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Session expired.");
        localStorage.setItem("flowpilot_token", data.token);
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(endpoint, options = {}, retry = true) {
  const token = localStorage.getItem("flowpilot_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  const isAuthSessionEndpoint = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"].includes(endpoint);
  if (response.status === 401 && retry && !isAuthSessionEndpoint) {
    try {
      await refreshAccessToken();
      return request(endpoint, options, false);
    } catch {
      window.dispatchEvent(new Event("flowpilot:unauthorized"));
    }
  }
  if (response.status === 401 && endpoint === "/api/auth/me")
    window.dispatchEvent(new Event("flowpilot:unauthorized"));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    request(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export const unwrapList = (payload) =>
  Array.isArray(payload) ? payload : payload.data || [];
export { API_URL };
