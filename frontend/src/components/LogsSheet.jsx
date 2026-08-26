import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Flame, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import api from "@/lib/api";

const MACRO_COLORS = { protein: "#FF2D95", carbs: "#00E5FF", fat: "#FF00E5" };

export default function LogsSheet({ open, onClose, refreshKey }) {
  const [data, setData] = useState({ logs: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/logs").then((r) => setData(r.data)).catch(() => {}),
      api.get("/logs/trend?days=7").then((r) => setTrend(r.data.trend)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, refreshKey, load]);

  const del = async (id) => {
    await api.delete(`/logs/${id}`);
    load();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed z-50 top-0 right-0 h-full w-full sm:w-[420px] glass-strong overflow-y-auto hide-scrollbar"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            data-testid="logs-sheet"
          >
            <div className="sticky top-0 z-10 glass-strong flex items-center gap-3 p-5 border-b border-white/10">
              <div>
                <h2 className="font-display text-xl font-extrabold">My Calorie Logs</h2>
                <p className="text-xs text-mapo-emeraldb">Everything you've tracked</p>
              </div>
              <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors" data-testid="logs-close">
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-5 w-5 text-mapo-orange" />
                  <p className="font-display text-2xl font-black text-gradient">{data.totals.calories}</p>
                  <span className="text-white/50 text-sm mb-0.5">kcal tracked</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["protein", "carbs", "fat"].map((k) => (
                    <div key={k} className="text-center">
                      <p className="font-display font-bold" style={{ color: MACRO_COLORS[k] }}>{data.totals[k]}g</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 capitalize">{k}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-4" data-testid="logs-trend">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-mapo-cyanb" />
                  <p className="text-sm font-display font-semibold">Last 7 days</p>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={trend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: "short" })}
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ background: "rgba(14,7,16,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff" }}
                      labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
                      formatter={(v) => [`${v} kcal`, "Logged"]}
                    />
                    <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                      {trend.map((_, i) => (
                        <Cell key={i} fill={i === trend.length - 1 ? "#FF2D95" : "#00E5FF"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {loading ? (
                <p className="text-center text-white/40 text-sm py-8">Loading...</p>
              ) : data.logs.length === 0 ? (
                <p className="text-center text-white/40 text-sm py-8" data-testid="logs-empty">No logs yet. Tap "Log kcal" on any meal in the feed!</p>
              ) : (
                <div className="space-y-2">
                  {data.logs.map((l) => (
                    <div key={l.id} className="glass rounded-2xl p-3 flex items-center gap-3" data-testid={`log-item-${l.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{l.dish_name}</p>
                        <p className="text-xs text-white/40">{l.protein}g P · {l.carbs}g C · {l.fat}g F</p>
                      </div>
                      <span className="text-sm font-display font-bold text-mapo-emeraldb shrink-0">{l.calories} kcal</span>
                      <button onClick={() => del(l.id)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0" data-testid={`log-delete-${l.id}`}>
                        <Trash2 className="h-4 w-4 text-white/50" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
