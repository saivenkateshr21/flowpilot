import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);
const tokenKey = "flowpilot_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const saveSession = (payload) => {
    localStorage.setItem(tokenKey, payload.token);
    setToken(payload.token);
    setUser(payload.user);
  };

  const clearSession = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      if (token) await api.post("/api/auth/logout", {});
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("flowpilot:unauthorized", handleUnauthorized);
    if (token)
      api
        .get("/api/auth/me")
        .then((data) => setUser(data.user))
        .catch(clearSession)
        .finally(() => setLoading(false));
    return () =>
      window.removeEventListener("flowpilot:unauthorized", handleUnauthorized);
  }, [token]);

  const login = async (credentials) =>
    saveSession(await api.post("/api/auth/login", credentials));
  const register = async (details) =>
    saveSession(await api.post("/api/auth/register", details));
  const updateProfile = async (details) => {
    const data = await api.put("/api/auth/profile", details);
    setUser(data.user);
    return data.user;
  };
  const changePassword = (details) =>
    api.put("/api/auth/change-password", details);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
