import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, Trophy, Sparkles, Droplet, Beef, Cookie } from "lucide-react";

const ICONS = { log: ClipboardList, trophy: Trophy, sparkles: Sparkles, droplet: Droplet, beef: Beef, cookie: Cookie };

const TIPS = {
  "Daily Meal Logs": "3 meals logged, no cap 🔥 One more protein snack and today is a certified W.",
  "Macro Achievements": "7-day protein streak? You ate that up. Absolute macro royalty, periodt 👑",
  "Diet Coach Tips": "Coach hack: half the plate veggies, a quarter protein, a quarter carbs. Simple, balanced, elite.",
  "Hydration": "3L water challenge, fr. Kick it off with lemon-ginger water — hydration hits different ✨",
  "Protein Wins": "Protein every meal = main-character energy. Paneer, eggs, curd, dal. Let's get it 💪",
  "Cheat Day Balance": "Cheat meal? Zero guilt, bestie. Keep the rest light + stay moving. Balance is the vibe.",
};

export default function StoriesTray({ stories }) {
  const [active, setActive] = useState(null);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex gap-4 overflow-x-auto hide-scrollbar py-4" data-testid="stories-tray">
        {stories.map((s) => {
          const Icon = ICONS[s.icon] || Sparkles;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className="flex flex-col items-center gap-2 shrink-0 group"
              data-testid={`story-${s.id}`}
            >
              <span className="p-[2.5px] rounded-full bg-mapo-yellow group-hover:scale-105 transition-transform duration-300">
                <span className="block h-[70px] w-[70px] rounded-full p-[2px] bg-mapo-bg">
                  <span className="h-full w-full grid place-items-center bg-mapo-yellow text-mapo-black font-display text-lg">{(s.title || "?").charAt(0)}</span>
                </span>
              </span>
              <span className="text-[11px] text-white/70 max-w-[74px] text-center leading-tight flex items-center gap-1">
                <Icon className="h-3 w-3 text-mapo-emeraldb shrink-0" />
                <span className="truncate">{s.title.split(" ")[0]}</span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            data-testid="story-modal"
          >
            <motion.div
              className="glass-strong rounded-3xl w-full max-w-sm overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1.5 bg-mapo-yellow" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 grid place-items-center bg-mapo-yellow text-mapo-black border-[3px] border-mapo-black font-display text-lg">{(active.title || "?").charAt(0)}</span>
                    <div>
                      <p className="font-display font-bold">{active.title}</p>
                      <p className="text-xs text-mapo-emeraldb">MAPO Coach</p>
                    </div>
                  </div>
                  <button onClick={() => setActive(null)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" data-testid="story-close">
                    <X className="h-5 w-5 text-white/70" />
                  </button>
                </div>
                <p className="text-white/85 leading-relaxed">{TIPS[active.title]}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
