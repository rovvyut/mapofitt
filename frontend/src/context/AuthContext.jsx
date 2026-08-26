import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiErrorDetail, TOKEN_KEY } from "@/lib/api";
import { disableGoogleAutoSelect } from "@/lib/googleAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState("");

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // api.js fires this when any request comes back 401, so an expired or
  // revoked token drops the user out of the UI instead of leaving a stale
  // "logged in" shell that fails on every action.
  useEffect(() => {
    const onUnauthenticated = () => setUser(null);
    window.addEventListener("mapo:unauthenticated", onUnauthenticated);

    // Log out in one tab, log out in all of them.
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY && !e.newValue) setUser(null);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("mapo:unauthenticated", onUnauthenticated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  // Called with the ID token that Google Identity Services hands the browser.
  // The backend verifies it against Google's public keys before trusting it.
  const loginWithGoogleCredential = useCallback(async (credential) => {
    try {
      const { data } = await api.post("/auth/google", { credential });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setAuthNotice("");
      return { ok: true };
    } catch (e) {
      const status = e.response?.status;
      if (status === 409) {
        // This email already has a password account. Auto-linking it would be
        // account takeover, so the backend refuses.
        const msg = formatApiErrorDetail(e.response?.data?.detail);
        setAuthNotice(msg);
        return { ok: false, error: msg };
      }
      if (status === 503) {
        return { ok: false, error: "Google sign-in is not available right now." };
      }
      if (status === 429) {
        return { ok: false, error: "Too many attempts. Please wait a few minutes." };
      }
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setAuthNotice("");
      return { ok: true };
    } catch (e) {
      if (e.response?.status === 429) {
        return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
      }
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      setAuthNotice("");
      return { ok: true };
    } catch (e) {
      if (e.response?.status === 429) {
        return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
      }
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Server-side cleanup failed; still drop the local token.
    }
    // Without this, Google silently signs the user straight back in.
    disableGoogleAutoSelect();
    clearSession();
  }, [clearSession]);

  // Revokes every token for this account, on every device. Use after a
  // password change or if the user thinks someone else has access.
  const logoutEverywhere = useCallback(async () => {
    try {
      await api.post("/auth/logout-all");
      clearSession();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        authNotice,
        login,
        register,
        logout,
        logoutEverywhere,
        loginWithGoogleCredential,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
