import { useEffect, useState } from "react";

/** Live media-query state, so a rotation or a resize is not a stale layout. */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? Boolean(window.matchMedia?.(query).matches) : false
  );

  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    setMatches(mq.matches);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}
