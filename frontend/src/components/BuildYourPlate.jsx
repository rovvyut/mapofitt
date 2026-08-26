/**
 * BUILD YOUR PLATE
 *
 * MAPO's one signature control. It is deliberately not a button: it is a
 * physical dial that happens to live on a web page. The behaviour is
 * mechanical rather than bouncy — it depresses, it does not spring; the ring
 * accelerates, it does not glow.
 *
 * The click sequence is three beats:
 *   1. the face depresses, like a real detent
 *   2. a short synthesised rev (see lib/plateSound.js — no sample, no brand)
 *   3. the ring lets go of the face and opens out into a plate, which
 *      becomes the meal builder
 *
 * Sound never plays before this is clicked, and the mute control sits right
 * next to it rather than buried in a settings pane.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isMuted, setMuted, playRev } from "@/lib/plateSound";
import useReducedMotion from "@/hooks/useReducedMotion";

const TICKS = 72;

export default function BuildYourPlate({ onOpen, size = 300 }) {
  const reduced = useReducedMotion();
  const [muted, setMutedState] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [opening, setOpening] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    setMutedState(isMuted());
    // Copy the ref out now: by cleanup time `timers.current` may point at a
    // different array, and the pending timeouts would never be cleared.
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const toggleSound = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setMuted(next);
      return next;
    });
  }, []);

  const activate = useCallback(() => {
    if (opening) return;
    setPressed(true);
    playRev();

    // The ring is already travelling by the time the rev peaks; the two are
    // meant to be read as one event, not as a sound and then a transition.
    timers.current.push(
      setTimeout(() => {
        setPressed(false);
        setOpening(true);
      }, reduced ? 0 : 140)
    );
    timers.current.push(
      setTimeout(() => {
        onOpen?.();
        setOpening(false);
      }, reduced ? 60 : 720)
    );
  }, [onOpen, opening, reduced]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    },
    [activate]
  );

  const ringDuration = hovered ? 9 : 26;

  return (
    <div className="flex flex-col items-center" data-testid="build-your-plate">
      <div className="relative" style={{ width: size, height: size }}>
        {/* The plate: released by the ring on click, expands past the frame. */}
        <AnimatePresence>
          {opening && (
            <motion.div
              key="plate"
              className="absolute left-1/2 top-1/2 rounded-full border border-mapo-accent bg-mapo-accent pointer-events-none"
              style={{ width: size, height: size, x: "-50%", y: "-50%" }}
              initial={{ scale: 0.94, opacity: 1 }}
              animate={{ scale: reduced ? 1 : 9, opacity: [1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.1 : 0.72, ease: [0.7, 0, 0.3, 1], times: [0, 0.6, 1] }}
            />
          )}
        </AnimatePresence>

        {/* Outer ring. Tick marks rather than a plain stroke, so the rotation
            is legible — a spinning circle looks identical to a still one. */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 spin-slow"
          style={{ animationDuration: `${ringDuration}s` }}
          aria-hidden="true"
        >
          <g stroke="currentColor" className="text-mapo-cream/15">
            {Array.from({ length: TICKS }, (_, i) => {
              const a = (i / TICKS) * Math.PI * 2;
              const long = i % 6 === 0;
              const r1 = long ? 88 : 92;
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(a) * r1}
                  y1={100 + Math.sin(a) * r1}
                  x2={100 + Math.cos(a) * 97}
                  y2={100 + Math.sin(a) * 97}
                  strokeWidth={long ? 1.6 : 0.8}
                />
              );
            })}
          </g>
        </svg>

        {/* A second, static ring that tightens on hover — the mechanical
            "the dial has engaged" cue, done with radius rather than glow. */}
        <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden="true">
          <circle
            cx="100"
            cy="100"
            r={hovered ? 82 : 84}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className={hovered ? "text-mapo-accent" : "text-mapo-cream/20"}
            style={{ transition: "r 0.3s cubic-bezier(0.2,0,0,1), color 0.3s ease" }}
          />
        </svg>

        {/* The face. */}
        <motion.button
          type="button"
          onClick={activate}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          aria-label="Build your plate — open the meal builder"
          className={`absolute left-1/2 top-1/2 rounded-full grid place-items-center select-none border transition-colors duration-200 ${
            pressed
              ? "bg-mapo-accent text-mapo-ink border-mapo-accent"
              : hovered
              ? "bg-mapo-raised text-mapo-accent border-mapo-accent"
              : "bg-mapo-raised text-mapo-cream border-mapo-cream/15"
          }`}
          style={{ width: size * 0.72, height: size * 0.72, x: "-50%", y: "-50%" }}
          animate={{
            scale: reduced ? 1 : pressed ? 0.955 : hovered ? 1.035 : 1,
            y: pressed ? "-48%" : "-50%",
          }}
          transition={{ type: "tween", duration: 0.16, ease: [0.2, 0, 0, 1] }}
          data-testid="build-your-plate-btn"
        >
          <span className="block text-center leading-none">
            <span
              className="block font-display uppercase"
              style={{
                fontSize: size * 0.115,
                letterSpacing: hovered ? "0.02em" : "-0.02em",
                transition: "letter-spacing 0.3s cubic-bezier(0.2,0,0,1)",
              }}
            >
              Build
            </span>
            <span
              className="block font-display uppercase mt-1.5"
              style={{
                fontSize: size * 0.077,
                letterSpacing: hovered ? "0.02em" : "-0.02em",
                transition: "letter-spacing 0.3s cubic-bezier(0.2,0,0,1)",
              }}
            >
              Your Plate
            </span>
          </span>
        </motion.button>
      </div>

      <div className="flex items-center gap-4 mt-7">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          className="pressable label hover:text-mapo-accent"
          data-testid="plate-sound-toggle"
        >
          Sound · {muted ? "Off" : "On"}
        </button>
        <span className="h-3 w-px bg-mapo-cream/15" aria-hidden="true" />
        <span className="label">Press to begin</span>
      </div>
    </div>
  );
}
