import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Mail, Users } from "lucide-react";
import api from "@/lib/api";

export default function AdminUsersSheet({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    api
      .get("/admin/users")
      .then((r) => setUsers(r.data))
      .catch((e) => setError(e.response?.status === 403 ? "Admins only." : "Could not load users."))
      .finally(() => setLoading(false));
  }, [open]);

  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "—";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed z-50 top-0 right-0 h-full w-full sm:w-[440px] glass-strong overflow-y-auto hide-scrollbar"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            data-testid="admin-sheet"
          >
            <div className="sticky top-0 z-10 glass-strong flex items-center gap-3 p-5 border-b border-white/10">
              <Shield className="h-5 w-5 text-mapo-orangeb" />
              <div>
                <h2 className="font-display text-xl font-extrabold">Registered Users</h2>
                <p className="text-xs text-mapo-cyanb">{users.length} member{users.length === 1 ? "" : "s"}</p>
              </div>
              <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors" data-testid="admin-close">
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            <div className="p-5 space-y-2">
              {loading ? (
                <p className="text-center text-white/40 text-sm py-8">Loading...</p>
              ) : error ? (
                <p className="text-center text-mapo-orange text-sm py-8" data-testid="admin-error">{error}</p>
              ) : users.length === 0 ? (
                <p className="text-center text-white/40 text-sm py-8">No users yet.</p>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="glass rounded-2xl p-4 flex items-center gap-3" data-testid={`admin-user-${u.id}`}>
                    <span className="h-10 w-10 rounded-full bg-mapo-yellow grid place-items-center font-display font-bold text-black shrink-0">
                      {(u.name || "U").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate flex items-center gap-2">
                        {u.name}
                        {u.role === "admin" && <span className="text-[10px] uppercase tracking-wider text-mapo-orangeb bg-mapo-orange/10 rounded-full px-2 py-0.5">admin</span>}
                      </p>
                      <p className="text-xs text-white/40 truncate flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</p>
                    </div>
                    <span className="text-xs text-white/40 shrink-0">{fmt(u.created_at)}</span>
                  </div>
                ))
              )}
              <p className="flex items-start gap-2 text-xs text-white/40 pt-4">
                <Users className="h-4 w-4 shrink-0 mt-0.5 text-mapo-cyanb" />
                Passwords are securely hashed (bcrypt) and can never be viewed — users sign in with credentials they set themselves.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
