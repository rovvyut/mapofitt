import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Maximize2, Heart, Bookmark, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function Row({ post, index, onInspect, onLogged, liked0, saved0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(liked0);
  const [saved, setSaved] = useState(saved0);
  const [logging, setLogging] = useState(false);

  useEffect(() => setLiked(liked0), [liked0]);
  useEffect(() => setSaved(saved0), [saved0]);

  const persist = (type) => user && api.post("/reactions/toggle", { post_id: post.id, type }).catch(() => {});

  const log = async () => {
    if (!user) { toast("Log in to track calories"); navigate("/login"); return; }
    setLogging(true);
    try {
      await api.post("/logs", { dish_name: post.dish_name, calories: post.calories, protein: post.protein, carbs: post.carbs, fat: post.fat, source: "index" });
      toast.success(`Logged ${post.dish_name}`, { description: `+${post.calories} kcal` });
      onLogged?.();
    } catch { toast.error("Could not log. Try again."); }
    finally { setLogging(false); }
  };

  return (
    <motion.div
      className="glass rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:glow-cyan transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.04 }}
      data-testid={`feed-card-${index}`}
    >
      <span className="font-display text-sm tracking-widest text-white/35 w-10 shrink-0">{String(index + 1).padStart(2, "0")}</span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-base sm:text-lg font-extrabold uppercase tracking-tight text-white truncate">{post.dish_name}</p>
        <p className="font-display text-[11px] tracking-[0.2em] text-mapo-cyanb mt-0.5">P {post.protein} · C {post.carbs} · F {post.fat}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[9px] uppercase tracking-wider text-white/70 glass rounded-full px-2 py-0.5">{t}</span>
          ))}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-baseline gap-1 justify-end">
          <span className="font-display text-3xl sm:text-4xl font-black text-gradient leading-none">{post.calories}</span>
          <span className="text-[10px] font-bold text-white/50 tracking-widest">KCAL</span>
        </div>
        <div className="flex items-center gap-2 justify-end mt-2">
          <button onClick={() => { setLiked((v) => !v); persist("like"); }} data-testid={`like-btn-${index}`} className="p-1.5 hover:scale-110 transition-transform">
            <Heart className={`h-4 w-4 ${liked ? "fill-mapo-orange text-mapo-orange" : "text-white/60"}`} />
          </button>
          <button onClick={() => { setSaved((v) => !v); persist("bookmark"); }} data-testid={`bookmark-btn-${index}`} className="p-1.5 hover:scale-110 transition-transform">
            <Bookmark className={`h-4 w-4 ${saved ? "fill-mapo-cyan text-mapo-cyan" : "text-white/60"}`} />
          </button>
          <button onClick={() => onInspect(post)} data-testid={`inspect-btn-${index}`} className="glass rounded-full p-2 hover:glow-cyan transition-shadow duration-300" title="Inspect in 3D">
            <Maximize2 className="h-4 w-4 text-mapo-cyanb" />
          </button>
          <button onClick={log} disabled={logging} data-testid={`log-calorie-btn-${index}`} className="rounded-full bg-mapo-tomato px-3 py-2 font-display text-xs font-bold text-black flex items-center gap-1.5 hover:glow-orange transition-shadow duration-300 disabled:opacity-60">
            <Flame className="h-3.5 w-3.5" /> Log
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PlateIndex({ posts, onInspect, onLogged, reactions }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults(null); return; }
    setSearching(true);
    const t = setTimeout(() => {
      api.get(`/foods/search?q=${encodeURIComponent(q)}&limit=30`)
        .then((r) => setResults(r.data.posts))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const display = results !== null ? results : posts;

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-mapo-cyanb mb-1">Explore</p>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight">The Plate Index</h2>
        </div>
        <span className="text-xs text-white/40">{display.length} dishes · tap ⤢ for 3D</span>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 1,000+ dishes — paneer, dal, biryani..."
          className="w-full glass rounded-full pl-11 pr-10 py-3 text-sm outline-none focus:border-mapo-cyan transition-colors"
          data-testid="plate-search"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10" data-testid="plate-search-clear">
            <X className="h-4 w-4 text-white/50" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {searching && <p className="text-center text-white/40 py-4 text-sm">Searching...</p>}
        {display.map((post, i) => (
          <Row
            key={post.id + "-" + i}
            post={post}
            index={i}
            onInspect={onInspect}
            onLogged={onLogged}
            liked0={reactions.liked.includes(post.id)}
            saved0={reactions.bookmarked.includes(post.id)}
          />
        ))}
        {!searching && display.length === 0 && (
          <p className="text-center text-white/40 py-12" data-testid="plate-empty">
            {results !== null ? "No dishes match your search." : "Loading dishes..."}
          </p>
        )}
      </div>
    </div>
  );
}
