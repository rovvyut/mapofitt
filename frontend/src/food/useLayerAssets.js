import { useEffect, useState } from "react";
import { imagePathsFor } from "./manifest";

/**
 * Decides, once, whether a dish has photoreal artwork available.
 *
 * The manifest names a PNG for every layer. Those files may or may not exist
 * yet, and a half-supplied set is worse than none — a photographed bun sitting
 * on a modelled patty looks broken. So this asks for every path and only
 * reports `ready` when the whole set loads. Anything missing and the scene
 * falls back to geometry as a complete, coherent look.
 *
 * `Image` is used rather than fetch because a 404 from a static host often
 * returns the SPA's index.html with a 200, which fetch would happily accept.
 * An <img> decode fails on HTML, which is the behaviour we actually want.
 */
export default function useLayerAssets(dishKey) {
  const [state, setState] = useState({ ready: false, checked: false, textures: {} });

  useEffect(() => {
    const paths = imagePathsFor(dishKey);
    if (!paths.length) {
      setState({ ready: false, checked: true, textures: {} });
      return undefined;
    }

    let cancelled = false;
    let settled = 0;
    let missing = 0;

    const done = () => {
      if (cancelled) return;
      setState({
        ready: missing === 0,
        checked: true,
        textures: missing === 0 ? Object.fromEntries(paths.map((p) => [p, p])) : {},
      });
    };

    paths.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        settled += 1;
        if (settled === paths.length) done();
      };
      img.onerror = () => {
        missing += 1;
        settled += 1;
        if (settled === paths.length) done();
      };
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [dishKey]);

  return state;
}
