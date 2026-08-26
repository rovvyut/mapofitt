import { useEffect, useState } from "react";

/**
 * Whether an element is meaningfully on screen.
 *
 * Used by the phone layouts, where there is no room for the tall pinned-scroll
 * choreography the desktop uses: instead of scrubbing an animation with the
 * scroll wheel, the food simply comes apart when you arrive at it.
 */
export default function useInView(ref, { threshold = 0.45, once = false } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, once]);

  return inView;
}
