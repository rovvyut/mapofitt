import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Salad, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { renderGoogleButton, isGoogleConfigured } from "@/lib/googleAuth";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, register, loginWithGoogleCredential, authNotice } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (!isGoogleConfigured() || !googleBtnRef.current) return;
    let cancelled = false;

    renderGoogleButton(googleBtnRef.current, async (credential) => {
      setError("");
      setLoading(true);
      const res = await loginWithGoogleCredential(credential);
      setLoading(false);
      if (res.ok) navigate("/");
      else setError(res.error);
    }).catch(() => {
      if (!cancelled) setGoogleError("Google sign-in could not load.");
    });

    return () => {
      cancelled = true;
    };
  }, [loginWithGoogleCredential, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = isLogin ? await login(email, password) : await register(name, email, password);
    setLoading(false);
    if (res.ok) navigate("/");
    else setError(res.error);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-3 py-3 text-sm outline-none focus:border-mapo-emeraldb transition-colors";

  return (
    <div className="min-h-screen relative grid place-items-center p-4">
      <div className="scifi-bg" />
      <div className="scifi-grid" />
      <motion.div
        className="relative z-10 w-full max-w-md glass-strong rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        data-testid="auth-card"
      >
        <div className="h-1.5 bg-mapo-yellow" />
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <span className="h-10 w-10 rounded-xl bg-mapo-yellow grid place-items-center glow-emerald">
              <Salad className="h-5 w-5 text-black" />
            </span>
            <span className="font-display text-2xl font-extrabold">MAP<span className="text-gradient">O</span></span>
          </Link>

          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">
            {isLogin ? "Welcome back" : "Join MAPO"}
          </h1>
          <p className="text-white/50 text-sm mb-6">
            {isLogin ? "Log in to track your nutrition journey." : "Create a free account to start logging meals."}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="auth-name" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input type="email" className={inputCls} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="auth-email" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input type="password" className={inputCls} placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} data-testid="auth-password" />
            </div>

            {error && <p className="text-sm text-mapo-orange" data-testid="auth-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-mapo-yellow py-3 font-display font-bold text-black flex items-center justify-center gap-2 hover:glow-emerald transition-shadow duration-300 disabled:opacity-60"
              data-testid="auth-submit"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {isGoogleConfigured() ? (
            <div className="flex justify-center" data-testid="google-signin-btn">
              {/* Google Identity Services renders its official button here. */}
              <div ref={googleBtnRef} />
            </div>
          ) : (
            <p className="text-xs text-white/40 text-center">
              Google sign-in is not configured.
            </p>
          )}
          {googleError && (
            <p className="text-sm text-mapo-orange text-center mt-2">{googleError}</p>
          )}
          {authNotice && (
            <p className="text-sm text-mapo-orange text-center mt-2" data-testid="auth-notice">
              {authNotice}
            </p>
          )}

          <p className="text-sm text-white/50 text-center mt-6">
            {isLogin ? "New to MAPO? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="text-mapo-emeraldb hover:underline" data-testid="auth-switch">
              {isLogin ? "Join free" : "Log in"}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
