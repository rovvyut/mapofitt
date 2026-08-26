import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";


function getProfile() {
  try {
    const p = JSON.parse(localStorage.getItem("mapo_profile"));
    if (p) return p;
  } catch (_) {}
  return { name: "Friend", age: 28, gender: "male", height: 172, weight: 74, target_weight: 70, activity_level: 2, goal: 3, diet_preference: "veg" };
}

function bold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-mapo-emeraldb font-semibold">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function CoachChat({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("hinglish");
  const [exhausted, setExhausted] = useState(false);
  const [messages, setMessages] = useState([
    { role: "coach", text: "Haanji! Main aapka MAPO Coach hoon 🌿 Bataiye — aaj kya khaya, ya kya khana plan kar rahe ho? (Type in English anytime, main samajh jaunga!)" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const sessionRef = useRef(localStorage.getItem("mapo_coach_session") || null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing || exhausted) return;
    if (!user) { onClose(); navigate("/login"); return; }
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const { data } = await api.post("/coach", {
        session_id: sessionRef.current,
        message: text,
        mode,
        user_profile: getProfile(),
      });
      if (data.session_id) {
        sessionRef.current = data.session_id;
        localStorage.setItem("mapo_coach_session", data.session_id);
      }
      setMessages((m) => [...m, { role: "coach", text: data.response }]);
    } catch (e) {
      const is429 = e?.response?.status === 429;
      const msg = is429 ? e.response.data.detail : "Sorry, thodi si dikkat aa gayi. Please try again.";
      setMessages((m) => [...m, { role: "coach", text: msg }]);
      if (is429) setExhausted(true);
    } finally {
      setTyping(false);
    }
  };

  const suggestions = mode === "hinglish"
    ? ["Dinner me kya khaun?", "2 pegs whiskey pi li", "Pizza khana hai"]
    : ["What should I eat for dinner?", "I had 2 glasses of wine", "I want pizza"];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed z-50 bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[400px] h-[85vh] md:h-[600px] glass-strong md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            data-testid="coach-chat"
          >
            <div className="h-1.5 bg-mapo-yellow" />
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <span className="h-11 w-11 grid place-items-center bg-mapo-yellow text-mapo-black border-[3px] border-mapo-black font-display text-lg">M</span>
              <div className="min-w-0">
                <p className="font-display font-bold flex items-center gap-1.5">MAPO Coach <Sparkles className="h-4 w-4 text-mapo-emeraldb" /></p>
                <p className="text-xs text-mapo-emeraldb">AI Coach · warm & judgment-free</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setMode((mo) => (mo === "hinglish" ? "english" : "hinglish"))}
                  className="text-xs glass rounded-full px-2.5 py-1 text-white/80 hover:text-white transition-colors"
                  data-testid="coach-mode-toggle"
                >
                  {mode === "hinglish" ? "Hinglish" : "English"}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors" data-testid="coach-close">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3" data-testid="coach-messages">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-mapo-yellow text-black font-medium"
                      : "glass text-white/90"
                  }`}>
                    {m.role === "coach" ? bold(m.text) : m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="h-2 w-2 rounded-full bg-mapo-emeraldb animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="shrink-0 text-xs glass rounded-full px-3 py-1.5 text-white/70 hover:text-white transition-colors" data-testid="coach-suggestion">
                    {s}
                  </button>
                ))}
              </div>
              {!user ? (
                <button
                  onClick={() => { onClose(); navigate("/login"); }}
                  className="w-full rounded-full bg-mapo-yellow py-3 font-display font-bold text-black flex items-center justify-center gap-2 hover:glow-emerald transition-shadow duration-300"
                  data-testid="coach-login-gate"
                >
                  <Lock className="h-4 w-4" /> Log in to chat with the Coach
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    disabled={exhausted}
                    placeholder={exhausted ? "Session used — back tomorrow!" : mode === "hinglish" ? "Message likhiye..." : "Type a message..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-mapo-emeraldb transition-colors disabled:opacity-50"
                    data-testid="coach-input"
                  />
                  <button onClick={send} disabled={exhausted} className="rounded-full bg-mapo-yellow p-3 text-black hover:glow-emerald transition-shadow duration-300 disabled:opacity-50" data-testid="coach-send">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
