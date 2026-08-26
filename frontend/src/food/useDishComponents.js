import { useEffect, useState } from "react";
import api from "@/lib/api";

/**
 * Pulls one dish's priced components from the API.
 *
 * There is deliberately no bundled copy of these numbers to fall back on. A
 * hardcoded shadow table is exactly how a UI starts quietly disagreeing with
 * the database it claims to be showing, so when the request fails the section
 * says so and hides the figures rather than displaying a plausible lie. The
 * food still renders and still comes apart — only the numbers wait.
 */
export default function useDishComponents(dishKey) {
  const [state, setState] = useState({ dish: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    const load = async (attempt = 0) => {
      try {
        const res = await api.get(`/foods/components/${dishKey}`);
        if (!cancelled) setState({ dish: res.data, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        if (attempt === 0) {
          setTimeout(() => load(1), 900);
          return;
        }
        setState({ dish: null, loading: false, error: "unavailable" });
      }
    };

    setState({ dish: null, loading: true, error: null });
    load();
    return () => {
      cancelled = true;
    };
  }, [dishKey]);

  return state;
}
