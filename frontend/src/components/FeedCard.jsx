import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Bookmark, Flame, Maximize2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const MACRO_COLORS = { protein: "#FF2D95", carbs: "#00E5FF", fat: "#FF00E5" };

function MacroPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-xs font-display font-bold text-white">{value}g</span>
    </div>
  );
}

export default function FeedCard({ post, index, onInspect, onLogged, initialLiked = false, initialSaved = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [burst, setBurst] = useState(false);
  const [logging, setLogging] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => setLiked(initialLiked), [initialLiked]);
  useEffect(() => setSaved(initialSaved), [initialSaved]);

  const persist = (type) => {
    if (user) api.post("/reactions/toggle", { post_id: post.id, type }).catch(() => {});
  };

  const doLike = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 850);
    if (!liked) {
      setLiked(true);
      persist("like");
    }
  };

  const toggleLike = () => {
    setLiked((v) => !v);
    persist("like");
  };

  const toggleSave = () => {
    setSaved((v) => !v);
    persist("bookmark");
  };

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) doLike();
    lastTap.current = now;
  };

  const logCalorie = async () => {
    if (!user) {
      toast("Log in to track your calories", { description: "Join MAPO free to save your daily logs." });
      navigate("/login");
      return;
    }
    setLogging(true);
    try {
      await api.post("/logs", {
        dish_name: post.dish_name,
        calories: post.calories,
        protein: post.protein,
        carbs: post.carbs,
        fat: post.fat,
        source: "feed",
      });
      toast.success(`Logged ${post.dish_name}`, { description: `+${post.calories} kcal added to today.` });
      onLogged?.();
    } catch {
      toast.error("Could not log right now. Try again.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <motion.article
      className="glass rounded-3xl overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
      data-testid={`feed-card-${index}`}
    >
      {/* header */}
      <div className="flex items-center gap-3 p-4">
        <span className="p-[2px] rounded-full bg-mapo-yellow">
          <span className="h-10 w-10 grid place-items-center bg-mapo-yellow text-mapo-black border-[3px] border-mapo-black font-display text-lg">
            {(post.author || "?").charAt(0)}
          </span>
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-sm truncate">{post.author}</p>
          <p className="text-xs text-white/50 truncate">{post.handle} · {post.cuisine}</p>
        </div>
        <span className="ml-auto text-xs font-display font-bold text-mapo-emeraldb bg-mapo-emerald/10 rounded-full px-3 py-1 border border-mapo-emerald/20">
          {post.calories} kcal
        </span>
      </div>

      {/* image-free "reel plate" panel */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer select-none bg-mapo-surface"
        onClick={handleImageTap}
        data-testid={`feed-image-${index}`}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,45,149,0.22), transparent 55%), radial-gradient(circle at 80% 85%, rgba(0,229,255,0.20), transparent 55%)" }} />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

        <span className="absolute top-4 left-4 font-display text-xs tracking-[0.3em] text-white/45">
          {String(index + 1).padStart(2, "0")} / {post.cuisine.toUpperCase()}
        </span>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="flex items-end gap-1">
            <span className="font-display text-7xl sm:text-8xl font-black text-gradient leading-none">{post.calories}</span>
            <span className="font-display text-sm font-bold text-white/60 mb-3 tracking-widest">KCAL</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white mt-3 leading-tight">{post.dish_name}</p>
          <p className="font-display text-xs tracking-[0.25em] text-mapo-cyanb mt-2">
            P {post.protein} · C {post.carbs} · F {post.fat}
          </p>
        </div>

        {burst && (
          <Heart className="absolute inset-0 m-auto h-28 w-28 drop-shadow-2xl animate-heart-pop" style={{ color: "#FF2D95", fill: "#FF2D95" }} />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onInspect(post); }}
          className="absolute top-3 right-3 glass-strong rounded-full p-2.5 hover:glow-cyan transition-shadow duration-300"
          data-testid={`inspect-btn-${index}`}
          title="Inspect in 3D"
        >
          <Maximize2 className="h-4 w-4 text-mapo-cyanb" />
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 justify-center">
          {post.tags.map((t) => (
            <span key={t} className="text-[10px] uppercase tracking-wider text-white/80 glass rounded-full px-2 py-0.5">{t}</span>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className="transition-transform duration-200 hover:scale-110 active:scale-95" data-testid={`like-btn-${index}`}>
            <Heart className={`h-6 w-6 ${liked ? "fill-mapo-orange text-mapo-orange" : "text-white/80"}`} />
          </button>
          <button className="transition-transform duration-200 hover:scale-110 text-white/80" data-testid={`comment-btn-${index}`}>
            <MessageCircle className="h-6 w-6" />
          </button>
          <button onClick={toggleSave} className="ml-auto transition-transform duration-200 hover:scale-110 active:scale-95" data-testid={`bookmark-btn-${index}`}>
            <Bookmark className={`h-6 w-6 ${saved ? "fill-mapo-cyan text-mapo-cyan" : "text-white/80"}`} />
          </button>
        </div>

        <p className="text-sm text-white/70">
          <span className="font-semibold text-white">{(post.likes + (liked ? 1 : 0)).toLocaleString()} likes</span>
        </p>
        <p className="text-sm text-white/70 leading-relaxed">{post.caption}</p>

        <div className="flex items-center gap-4 pt-1">
          <MacroPill label="P" value={post.protein} color={MACRO_COLORS.protein} />
          <MacroPill label="C" value={post.carbs} color={MACRO_COLORS.carbs} />
          <MacroPill label="F" value={post.fat} color={MACRO_COLORS.fat} />
        </div>

        <button
          onClick={logCalorie}
          disabled={logging}
          className="w-full rounded-2xl bg-mapo-tomato py-3 font-display font-bold text-black flex items-center justify-center gap-2 hover:glow-orange transition-shadow duration-300 disabled:opacity-60"
          data-testid={`log-calorie-btn-${index}`}
        >
          <Flame className="h-5 w-5" />
          {logging ? "Logging..." : `Log ${post.calories} kcal`}
        </button>
      </div>
    </motion.article>
  );
}
