import { useEffect, useRef, useState } from "react";

/**
 * How far a tall section has travelled through the viewport, 0 to 1.
 *
 * Returns a ref, not state, because this updates on every scroll frame and the
 * consumer is a WebGL scene that reads it inside its own render loop — routing
 * it through React would re-render a three.js tree sixty times a second for no
 * benefit. `phase` is the coarse, cheap-to-render version (which third of the
 * section we are in) and that one is state, because the copy alongside the
 * animation does need to change with it.
 */
export default function useScrollProgress(ref, { steps = 3 } = {}) {
  const progress = useRef(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let frame = null;
    let lastPhase = -1;

    const measure = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) {
        progress.current = 0;
        return;
      }
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      progress.current = p;

      const nextPhase = Math.min(steps - 1, Math.floor(p * steps));
      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase;
        setPhase(nextPhase);
      }
    };

    const onScroll = () => {
      if (frame == null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, steps]);

  return { progress, phase };
}
