import { useEffect, useRef, useState } from "react";

/**
 * Eases a number toward a new value instead of swapping it.
 *
 * The point is legibility, not decoration: when a burger goes from 568 to 649
 * kcal, watching the number travel tells you the change was large in a way
 * that a jump-cut does not. Duration is fixed rather than proportional so
 * every change feels like the same gesture.
 *
 * Honours prefers-reduced-motion by snapping straight to the target.
 */
export default function useCountUp(value, { duration = 620, decimals = 0 } = {}) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || from.current === value) {
      from.current = value;
      setDisplay(value);
      return undefined;
    }

    const start = performance.now();
    const origin = from.current;
    const delta = value - origin;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo: fast commitment, soft landing.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -9 * t);
      const next = origin + delta * eased;
      setDisplay(decimals ? Number(next.toFixed(decimals)) : Math.round(next));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };

    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [value, duration, decimals]);

  return display;
}
