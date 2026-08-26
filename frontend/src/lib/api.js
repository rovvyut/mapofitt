import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  // Without a timeout a hung backend leaves the UI spinning forever.
  timeout: 30000,
  // Auth travels in the Authorization header, never in cookies. Sending
  // cookies cross-site is what makes an API CSRF-able.
  withCredentials: false,
});

export const TOKEN_KEY = "mapo_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // The token is expired, revoked, or invalid. Drop it now rather than
    // letting every later request fail with a confusing error.
    if (status === 401) {
      const hadToken = Boolean(localStorage.getItem(TOKEN_KEY));
      localStorage.removeItem(TOKEN_KEY);
      if (hadToken) {
        // AuthContext listens for this and clears the user.
        window.dispatchEvent(new Event("mapo:unauthenticated"));
      }
    }

    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : null))
      .filter(Boolean)
      .join(" ") || "Please check the details you entered.";
  if (detail && typeof detail.msg === "string") return detail.msg;
  return "Something went wrong. Please try again.";
}

export default api;
