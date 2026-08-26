import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Info, ChefHat, Loader2, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MacroScene from "@/three/MacroScene";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function MacroBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div data-testid={`inspector-macro-${label.toLowerCase()}`}>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="font-display font-bold" style={{ color }}>{value}g</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function FoodInspector({ post, onClose, onLogged }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState("");

  // Clear the previous dish's recipe whenever a different dish is opened,
  // otherwise the panel briefly shows the wrong recipe.
  useEffect(() => {
    setRecipe(null);
    setRecipeError("");
    setRecipeLoading(false);
  }, [post?.id]);

  const loadRecipe = async () => {
    if (!user) {
      toast("Log in to see recipes");
      onClose();
      navigate("/login");
      return;
    }
    setRecipeLoading(true);
    setRecipeError("");
    try {
      // Uncached dishes are written on first request, then served from the
      // database, so this is usually instant after the first time.
      const { data } = await api.get(`/foods/${encodeURIComponent(post.id)}/recipe`);
      setRecipe(data.recipe);
    } catch (e) {
      const status = e.response?.status;
      if (status === 429) setRecipeError("Daily recipe limit reached. Try again tomorrow.");
      else if (status === 404) setRecipeError("No recipe available for this dish.");
      else setRecipeError("Could not load the recipe. Please try again.");
    } finally {
      setRecipeLoading(false);
    }
  };

  const logIt = async () => {
    if (!user) {
      toast("Log in to track calories");
      onClose();
      navigate("/login");
      return;
    }
    try {
      await api.post("/logs", {
        dish_name: post.dish_name, calories: post.calories,
        protein: post.protein, carbs: post.carbs, fat: post.fat, source: "inspector",
      });
      toast.success(`Logged ${post.dish_name}`, { description: `+${post.calories} kcal` });
      onLogged?.();
      onClose();
    } catch {
      toast.error("Could not log. Try again.");
    }
  };

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="food-inspector"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 glass-strong rounded-full p-3 hover:glow-orange transition-shadow duration-300"
            data-testid="inspector-close"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="h-full w-full max-w-6xl mx-auto grid lg:grid-cols-2 items-center gap-6 p-4 sm:p-8">
            <motion.div
              className="h-[45vh] lg:h-[70vh] glass rounded-3xl overflow-hidden relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <MacroScene macros={{ protein: post.protein, carbs: post.carbs, fat: post.fat }} height="100%" compact />
            </motion.div>

            <motion.div
              className="glass-strong rounded-3xl p-6 sm:p-8 max-h-[70vh] overflow-y-auto hide-scrollbar"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-mapo-emeraldb font-display text-xs uppercase tracking-widest mb-2">{post.cuisine}</p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">{post.dish_name}</h2>
              <p className="text-white/50 text-sm mb-6">Serving: {post.serving}</p>

              <div className="flex items-end gap-2 mb-6">
                <span className="font-display text-5xl font-black text-gradient">{post.calories}</span>
                <span className="text-white/60 mb-1.5">kcal / serving</span>
              </div>

              <div className="space-y-4 mb-6">
                <MacroBar label="Protein" value={post.protein} max={60} color="#FF2D95" />
                <MacroBar label="Carbs" value={post.carbs} max={80} color="#00E5FF" />
                <MacroBar label="Fat" value={post.fat} max={40} color="#FF00E5" />
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs glass rounded-full px-3 py-1 text-white/80">{t}</span>
                ))}
              </div>

              <p className="flex items-start gap-2 text-sm text-white/50 mb-6">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-mapo-cyanb" />
                Rotate the 3D model and tap the core to see how this dish splits into protein, carbs and fats.
              </p>

              {/* ---------------- Ingredients & recipe ---------------- */}
              <div className="mb-6">
                {!recipe && !recipeLoading && (
                  <button
                    onClick={loadRecipe}
                    className="w-full rounded-2xl glass py-3 font-display font-semibold text-white flex items-center justify-center gap-2 hover:glow-cyan transition-shadow duration-300"
                    data-testid="inspector-recipe-btn"
                  >
                    <ChefHat className="h-5 w-5 text-mapo-cyanb" />
                    Ingredients &amp; recipe
                  </button>
                )}

                {recipeLoading && (
                  <div className="flex items-center justify-center gap-2 py-4 text-white/60 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Writing the recipe…
                  </div>
                )}

                {recipeError && (
                  <p className="text-sm text-mapo-orange text-center py-2" data-testid="inspector-recipe-error">
                    {recipeError}
                  </p>
                )}

                {recipe && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-5"
                    data-testid="inspector-recipe"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <ChefHat className="h-4 w-4 text-mapo-cyanb" />
                      <h3 className="font-display font-bold text-lg">Recipe</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-white/60 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Serves {recipe.servings}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Prep {recipe.prep_time_min} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" /> Cook {recipe.cook_time_min} min
                      </span>
                    </div>

                    <h4 className="font-display text-xs uppercase tracking-widest text-white/40 mb-2">
                      Ingredients
                    </h4>
                    <ul className="space-y-1.5 mb-5">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex justify-between gap-3 text-sm">
                          <span className="text-white/80">{ing.name}</span>
                          <span className="text-mapo-emeraldb shrink-0 font-medium">{ing.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    <h4 className="font-display text-xs uppercase tracking-widest text-white/40 mb-2">
                      Method
                    </h4>
                    <ol className="space-y-2.5 mb-4">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-white/80">
                          <span className="font-display font-bold text-mapo-cyanb shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>

                    {recipe.tips?.length > 0 && (
                      <>
                        <h4 className="font-display text-xs uppercase tracking-widest text-white/40 mb-2">
                          Tips
                        </h4>
                        <ul className="space-y-1.5 mb-4">
                          {recipe.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-white/60">• {tip}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {recipe.ai_generated && (
                      <p className="text-xs text-white/40 border-t border-white/10 pt-3">
                        AI-written home recipe — a starting point, not a tested one.
                        Check quantities and cooking times as you go.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              <button
                onClick={logIt}
                className="w-full rounded-2xl bg-mapo-tomato py-3.5 font-display font-bold text-black flex items-center justify-center gap-2 hover:glow-orange transition-shadow duration-300"
                data-testid="inspector-log-btn"
              >
                <Flame className="h-5 w-5" /> Log this meal
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
