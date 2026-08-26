import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, ArrowLeft, Repeat, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ACTIVITY = [
  { v: 1, l: "Sedentary" }, { v: 2, l: "Light" }, { v: 3, l: "Moderate" },
  { v: 4, l: "Very Active" }, { v: 5, l: "Athlete" },
];
const GOALS = [
  { v: 1, l: "Maintain" }, { v: 2, l: "Gain Weight" }, { v: 3, l: "Lose Fat" }, { v: 4, l: "Recomp" },
];
const PREFS = [
  { v: "vegetarian", l: "Vegetarian" }, { v: "egg", l: "Eggetarian" }, { v: "non-vegetarian", l: "Non-Veg" },
];
const CUISINES = ["Pan-Indian", "North Indian", "South Indian", "Continental", "Indo-Chinese", "West Indian"];
const MACRO_COLORS = { protein: "#FF2D95", carbs: "#00E5FF", fat: "#FF00E5" };

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-mapo-emeraldb transition-colors";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-white/60 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 border ${
        active ? "bg-mapo-emerald/20 border-mapo-emeraldb text-white" : "glass border-white/10 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({ label, value, unit }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <p className="font-display text-2xl font-black text-gradient">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-white/50 mt-0.5">{label}</p>
      {unit && <p className="text-[10px] text-white/30">{unit}</p>}
    </div>
  );
}

export default function DietPlanSheet({ open, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "", weight: 74, height: 172, age: 28, gender: "Male",
    activity_level: 3, goal: 3, target_weight: 68, meal_preference: "vegetarian",
    early_morning_choice: "Lemon Ginger Water", cuisines: [], dislikes: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [swapping, setSwapping] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCuisine = (c) =>
    setForm((f) => ({ ...f, cuisines: f.cuisines.includes(c) ? f.cuisines.filter((x) => x !== c) : [...f.cuisines, c] }));

  const mealTotals = (foods) => ({
    energy: Math.round(foods.reduce((s, f) => s + f.energy, 0) * 10) / 10,
    protein: Math.round(foods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    carbs: Math.round(foods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    fat: Math.round(foods.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  });

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/plans");
      setHistory(data);
      setShowHistory(true);
    } catch {
      toast.error("Could not load history.");
    }
  };

  const swap = async (mi, fi) => {
    const meal = result.meals[mi];
    const food = meal.foods[fi];
    setSwapping(`${mi}-${fi}`);
    try {
      const { data } = await api.post("/diet/swap", {
        slot: meal.slot,
        target_energy: food.energy,
        meal_preference: form.meal_preference,
        exclude: meal.foods.map((f) => f.name),
        cuisines: form.cuisines,
      });
      setResult((prev) => {
        const meals = prev.meals.map((m, idx) => {
          if (idx !== mi) return m;
          const foods = m.foods.map((f, j) => (j === fi ? data : f));
          return { ...m, foods, totals: mealTotals(foods) };
        });
        const daily = {
          energy: Math.round(meals.reduce((s, m) => s + m.totals.energy, 0) * 10) / 10,
          protein: Math.round(meals.reduce((s, m) => s + m.totals.protein, 0) * 10) / 10,
          carbs: Math.round(meals.reduce((s, m) => s + m.totals.carbs, 0) * 10) / 10,
          fat: Math.round(meals.reduce((s, m) => s + m.totals.fat, 0) * 10) / 10,
        };
        return { ...prev, meals, daily_totals: daily };
      });
      toast.success(`Swapped to ${data.name}`);
    } catch {
      toast.error("No matching alternative found.");
    } finally {
      setSwapping(null);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        weight: Number(form.weight), height: Number(form.height), age: Number(form.age),
        target_weight: Number(form.target_weight),
        dislikes: form.dislikes ? form.dislikes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      const { data } = await api.post("/diet/plan", payload);
      setResult(data);
      setShowHistory(false);
      localStorage.setItem("mapo_profile", JSON.stringify({
        name: form.name || "Friend", age: Number(form.age), gender: form.gender.toLowerCase(),
        height: Number(form.height), weight: Number(form.weight), target_weight: Number(form.target_weight),
        activity_level: Number(form.activity_level), goal: Number(form.goal),
        diet_preference: form.meal_preference.startsWith("veg") ? "veg" : "nonveg",
      }));
      if (user) {
        api.post("/plans", data).then(() => toast.success("Plan saved to your history 📚")).catch(() => {});
      }
      toast.success("Your personalised plan is ready! 🌿");
    } catch (e) {
      toast.error("Could not generate plan. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const macros = result?.macros;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed z-50 top-0 right-0 h-full w-full sm:w-[480px] glass-strong overflow-y-auto hide-scrollbar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            data-testid="diet-sheet"
          >
            <div className="sticky top-0 z-10 glass-strong flex items-center gap-3 p-5 border-b border-white/10">
              {(result || showHistory) && (
                <button onClick={() => { setResult(null); setShowHistory(false); }} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" data-testid="diet-back">
                  <ArrowLeft className="h-5 w-5 text-white/70" />
                </button>
              )}
              <div>
                <h2 className="font-display text-xl font-extrabold">{showHistory ? "Plan History" : result ? "Your MAPO Plan" : "Get My Diet Plan"}</h2>
                <p className="text-xs text-mapo-emeraldb">Personalised for your body & goals</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {user && !result && !showHistory && (
                  <button onClick={loadHistory} className="p-2 rounded-full glass hover:glow-cyan transition-shadow duration-300" data-testid="diet-history-btn" title="Plan history">
                    <History className="h-4 w-4 text-mapo-cyanb" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors" data-testid="diet-close">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
            </div>

            {showHistory ? (
              <div className="p-5 space-y-3" data-testid="diet-history">
                {history.length === 0 ? (
                  <p className="text-center text-white/40 text-sm py-8">No saved plans yet. Generate one to save it here!</p>
                ) : (
                  history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => { setResult(h.plan); setShowHistory(false); }}
                      className="w-full text-left glass rounded-2xl p-4 hover:glow-cyan transition-shadow duration-300"
                      data-testid={`history-item-${h.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display font-semibold">{h.plan?.name || "Plan"}</p>
                        <span className="text-xs text-mapo-emeraldb font-bold">{Math.round(h.plan?.target_calories || 0)} kcal</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">
                        BMI {h.plan?.bmi} · {new Date(h.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : !result ? (
              <div className="p-5 space-y-4">
                <Field label="Your name">
                  <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Rohan" data-testid="diet-name" />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Weight (kg)"><input type="number" className={inputCls} value={form.weight} onChange={(e) => set("weight", e.target.value)} data-testid="diet-weight" /></Field>
                  <Field label="Height (cm)"><input type="number" className={inputCls} value={form.height} onChange={(e) => set("height", e.target.value)} data-testid="diet-height" /></Field>
                  <Field label="Age"><input type="number" className={inputCls} value={form.age} onChange={(e) => set("age", e.target.value)} data-testid="diet-age" /></Field>
                </div>

                <Field label="Gender">
                  <div className="flex gap-2">
                    {["Male", "Female"].map((g) => (
                      <Chip key={g} active={form.gender === g} onClick={() => set("gender", g)} testid={`diet-gender-${g}`}>{g}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Target weight (kg)">
                  <input type="number" className={inputCls} value={form.target_weight} onChange={(e) => set("target_weight", e.target.value)} data-testid="diet-target-weight" />
                </Field>

                <Field label="Activity level">
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITY.map((a) => (
                      <Chip key={a.v} active={form.activity_level === a.v} onClick={() => set("activity_level", a.v)} testid={`diet-activity-${a.v}`}>{a.l}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Goal">
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => (
                      <Chip key={g.v} active={form.goal === g.v} onClick={() => set("goal", g.v)} testid={`diet-goal-${g.v}`}>{g.l}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Meal preference">
                  <div className="flex flex-wrap gap-2">
                    {PREFS.map((p) => (
                      <Chip key={p.v} active={form.meal_preference === p.v} onClick={() => set("meal_preference", p.v)} testid={`diet-pref-${p.v}`}>{p.l}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Early morning ritual">
                  <div className="flex flex-wrap gap-2">
                    {["Lemon Ginger Water", "Cumin Infused Water"].map((e) => (
                      <Chip key={e} active={form.early_morning_choice === e} onClick={() => set("early_morning_choice", e)} testid={`diet-morning-${e.split(" ")[0]}`}>{e}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Preferred cuisines (optional)">
                  <div className="flex flex-wrap gap-2">
                    {CUISINES.map((c) => (
                      <Chip key={c} active={form.cuisines.includes(c)} onClick={() => toggleCuisine(c)} testid={`diet-cuisine-${c}`}>{c}</Chip>
                    ))}
                  </div>
                </Field>

                <Field label="Dislikes (comma separated)">
                  <input className={inputCls} value={form.dislikes} onChange={(e) => set("dislikes", e.target.value)} placeholder="e.g. mushroom, karela" data-testid="diet-dislikes" />
                </Field>

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full rounded-2xl bg-mapo-yellow py-3.5 font-display font-bold text-black flex items-center justify-center gap-2 hover:glow-emerald transition-shadow duration-300 disabled:opacity-60"
                  data-testid="diet-submit"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {loading ? "Building your plan..." : "Generate My Plan"}
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-5" data-testid="diet-result">
                <div className="grid grid-cols-4 gap-2">
                  <MetricCard label="BMI" value={result.bmi} />
                  <MetricCard label="BMR" value={Math.round(result.bmr)} unit="kcal" />
                  <MetricCard label="TDEE" value={Math.round(result.tdee)} unit="kcal" />
                  <MetricCard label="Target" value={Math.round(result.target_calories)} unit="kcal" />
                </div>

                <div className="glass rounded-2xl p-4 space-y-1">
                  <p className="text-sm text-white/80">{result.bmi_insight}</p>
                  <p className="text-sm text-mapo-emeraldb">{result.goal_insight}</p>
                </div>

                <div>
                  <p className="font-display font-bold mb-3">Daily macro targets</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["protein", "carbs", "fat"].map((k) => (
                      <div key={k} className="glass rounded-2xl p-3 text-center">
                        <p className="font-display text-xl font-black" style={{ color: MACRO_COLORS[k] }}>{macros[k]}g</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/50 capitalize">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-display font-bold">Your meal plan</p>
                  {result.meals.map((meal, mi) => (
                    <div key={meal.slot} className="glass rounded-2xl p-4" data-testid={`meal-${meal.slot.replace(/\s/g, "-")}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-display font-semibold">{meal.label}</p>
                        <span className="text-xs text-mapo-emeraldb font-bold">{meal.totals.energy} kcal</span>
                      </div>
                      {meal.foods.length ? (
                        <ul className="space-y-1.5">
                          {meal.foods.map((f, i) => (
                            <li key={i} className="flex items-center justify-between text-sm gap-2 group">
                              <span className="text-white/80 flex-1 min-w-0">{f.name}</span>
                              <span className="text-white/40 text-xs shrink-0">{f.serving}</span>
                              <button
                                onClick={() => swap(mi, i)}
                                disabled={swapping === `${mi}-${i}`}
                                className="shrink-0 p-1.5 rounded-full glass hover:glow-cyan transition-shadow duration-300 disabled:opacity-50"
                                data-testid={`swap-btn-${meal.slot.replace(/\s/g, "-")}-${i}`}
                                title="Swap for a similar dish"
                              >
                                <Repeat className={`h-3.5 w-3.5 text-mapo-cyanb ${swapping === `${mi}-${i}` ? "animate-spin" : ""}`} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-white/40">Rest / hydration</p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-white/40 text-center pt-2">Estimated total: {result.daily_totals.energy} kcal · {result.daily_totals.protein}g P · {result.daily_totals.carbs}g C · {result.daily_totals.fat}g F</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
