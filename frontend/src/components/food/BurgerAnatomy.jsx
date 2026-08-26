/**
 * BURGER — ANATOMY
 *
 * Scroll pulls the burger apart, holds it open long enough to read, then puts
 * it back together as whatever the visitor has changed it into. The food is
 * the interface: every layer is clickable, hovering one dims the rest, and the
 * controls change the object on screen at the same moment they change the
 * numbers.
 *
 * All nutrition comes from /api/foods/components/burger. Nothing on this
 * screen knows what a bun costs; it only knows how to add up what the server
 * priced. See food/nutrition.js.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FoodStack from "@/food/FoodStack";
import LeaderLines from "@/food/LeaderLines";
import { DISH_MANIFEST, stackBurger } from "@/food/manifest";
import useDishComponents from "@/food/useDishComponents";
import useLayerAssets from "@/food/useLayerAssets";
import useScrollProgress from "@/hooks/useScrollProgress";
import useReducedMotion from "@/hooks/useReducedMotion";
import useMediaQuery from "@/hooks/useMediaQuery";
import useInView from "@/hooks/useInView";
import { totalFor, deltaFor } from "@/food/nutrition";
import { Kcal, MacroRow, MacroSplit, Stepper, ChoiceRow } from "./Readout";

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const DEFAULT_COUNTS = { bun: 1, patty: 1, cheese: 1, lettuce: 1, onion: 1, tomato: 1, sauce: 1 };
const VEG = ["lettuce", "onion", "tomato"];
const DEFAULT_VARIANTS = { bun: "sesame_bun", patty: "chicken_patty", sauce: "Mayonnaise" };

const PHASE_COPY = [
  { kicker: "Assembled", line: "One object. One number." },
  { kicker: "Separated", line: "Nine layers. Nine reasons that number is what it is." },
  { kicker: "Yours", line: "Change a layer and the number moves with it." },
];

export default function BurgerAnatomy() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { progress, phase } = useScrollProgress(sectionRef, { steps: 3 });
  const stageInView = useInView(stageRef, { threshold: 0.4 });

  /**
   * The pinned-scroll choreography is a desktop affordance. A phone has no
   * room for a 300vh section whose content is taller than the viewport — the
   * food would scroll out from under its own pin. There, the burger simply
   * separates when you reach it, and the Separate button drives it by hand.
   */
  const cinematic = isDesktop && !reduced;
  const { dish, loading, error } = useDishComponents("burger");
  const assets = useLayerAssets("burger");

  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [variants, setVariants] = useState(DEFAULT_VARIANTS);
  const [focusId, setFocusId] = useState(null);
  const [manual, setManual] = useState(null); // overrides scroll when used
  const [points, setPoints] = useState({});
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Track the stage size so the leader-line overlay matches the canvas exactly.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Scroll drives separation on a hold-in-the-middle curve: open by 42% of the
   * way through the section, stay open until 72%, closed again by the end. The
   * hold is what gives you time to actually read the layers, and the close is
   * the "reassembles into your burger" beat.
   *
   * A getter rather than a stored number: FoodStack reads this every frame
   * from inside its own loop, so it never needs to travel through React.
   */
  const explodeRef = useMemo(
    () => ({
      get current() {
        if (manual != null) return manual;
        if (!cinematic) return stageInView ? 1 : 0;
        const p = progress.current;
        if (p < 0.42) return easeInOut(p / 0.42);
        if (p < 0.72) return 1;
        return 1 - easeInOut((p - 0.72) / 0.28);
      },
    }),
    [manual, cinematic, stageInView, progress]
  );

  // ---------------------------------------------------------------- data
  /** Priced components, with the chosen variant swapped in where one applies. */
  const components = useMemo(() => {
    if (!dish) return {};
    const byKey = {};
    dish.layers.forEach((l) => {
      byKey[l.key] = l;
    });
    Object.entries(variants).forEach(([slot, chosen]) => {
      const opt = (dish.variants?.[slot] || []).find((o) => o.key === chosen);
      if (opt && byKey[slot]) {
        byKey[slot] = { ...byKey[slot], ...opt, label: byKey[slot].label, note: opt.label };
      }
    });
    return byKey;
  }, [dish, variants]);

  const total = useMemo(() => totalFor(components, counts), [components, counts]);

  // ------------------------------------------------------------- visuals
  const layers = useMemo(() => stackBurger(counts), [counts]);

  const labelRows = useMemo(() => {
    if (!box.h) return [];
    const top = 40;
    const usable = Math.max(120, box.h - 80);
    const gap = layers.length > 1 ? usable / (layers.length - 1) : 0;
    return layers.map((l, i) => ({
      ...l,
      y: top + gap * i,
      radius: (l.build?.r || 1.5) * 16,
      active: focusId === l.id,
      macros: components[l.nutritionKey],
    }));
  }, [layers, box.h, focusId, components]);

  // --------------------------------------------------------------- edits
  const setCount = useCallback((key, next) => {
    setCounts((c) => ({ ...c, [key]: Math.max(0, next) }));
  }, []);

  const reset = useCallback(() => {
    setCounts(DEFAULT_COUNTS);
    setVariants(DEFAULT_VARIANTS);
    setFocusId(null);
  }, []);

  const dirty =
    JSON.stringify(counts) !== JSON.stringify(DEFAULT_COUNTS) ||
    JSON.stringify(variants) !== JSON.stringify(DEFAULT_VARIANTS);

  const focused = focusId ? labelRows.find((l) => l.id === focusId) : null;
  // On a phone there is no scroll phase to read from, so the copy follows the
  // state the burger is actually in: apart once you have arrived at it, and
  // "yours" the moment you change something.
  const copyIndex = dirty
    ? 2
    : cinematic
    ? Math.min(phase, PHASE_COPY.length - 1)
    : Number(explodeRef.current > 0.5);
  const copy = PHASE_COPY[copyIndex];

  return (
    <section
      ref={sectionRef}
      id="burger"
      aria-labelledby="burger-heading"
      className="relative z-10"
      style={{ minHeight: cinematic ? "300vh" : "auto" }}
      data-testid="burger-section"
    >
      <div className={cinematic ? "sticky top-0" : ""}>
        <div className={`flex flex-col justify-center py-10 ${cinematic ? "min-h-screen" : ""}`}>
          <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
            {/* ---------------------------------------------- heading */}
            <header className="flex flex-wrap items-end justify-between gap-6 border-b border-mapo-cream/10 pb-6">
              <div>
                <p className="label">02 — What's inside it?</p>
                <h2 id="burger-heading" className="font-display text-display-sm text-mapo-cream mt-3">
                  Burger
                  <span className="block text-mapo-accent">Anatomy</span>
                </h2>
              </div>
              <div className="max-w-sm">
                <p className="label text-mapo-accent">{copy.kicker}</p>
                <p className="text-mapo-muted text-sm leading-relaxed mt-2">{copy.line}</p>
              </div>
            </header>

            <div className="grid lg:grid-cols-[1.55fr_1fr] gap-8 lg:gap-14 mt-8">
              {/* ------------------------------------------- the object */}
              <div>
                <div ref={stageRef} className="relative h-[46vh] min-h-[320px] lg:h-[58vh]">
                  {/* The canvas takes the left of the stage and the labels the
                      right. They are siblings rather than an overlay so the
                      food is never underneath its own annotation. */}
                  <FoodStack
                    className="absolute inset-y-0 left-0 w-full lg:w-[58%]"
                    layers={layers}
                    camera={DISH_MANIFEST.burger.camera}
                    fov={DISH_MANIFEST.burger.fov}
                    useImages={assets.ready}
                    explodeRef={explodeRef}
                    focusId={focusId}
                    onFocus={setFocusId}
                    onProject={setPoints}
                  />

                  {/* Leader lines are a desktop affordance. On a phone the
                      labels sit under the food where a thumb can reach them. */}
                  <div className="hidden lg:block absolute inset-0">
                    <LeaderLines
                      points={points}
                      labels={labelRows}
                      width={box.w}
                      height={box.h}
                      gutterX={box.w * 0.62}
                    />
                    {labelRows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onMouseEnter={() => setFocusId(row.id)}
                        onFocus={() => setFocusId(row.id)}
                        onClick={() => setFocusId(focusId === row.id ? null : row.id)}
                        style={{ top: row.y, left: `${62}%` }}
                        className="absolute -translate-y-1/2 w-[38%] text-left pl-4 group"
                        data-testid={`burger-label-${row.id}`}
                      >
                        <span
                          className={`font-display text-sm tracking-tight ${
                            row.active ? "text-mapo-accent" : "text-mapo-cream group-hover:text-mapo-accent"
                          }`}
                        >
                          {row.label}
                          {row.sublabel && (
                            <span className="text-mapo-muted font-body font-medium text-xs ml-2">
                              {row.sublabel}
                            </span>
                          )}
                        </span>
                        {row.macros && (
                          <span className="block label mt-1 tnum">
                            {Math.round(row.macros.kcal)} kcal
                            {" · "}
                            {row.macros.protein}p {row.macros.carbs}c {row.macros.fat}f
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Manual control. The scroll animation is the show; this is
                      how you drive it yourself, and the only way to drive it
                      when reduced motion is on. */}
                  <button
                    type="button"
                    onClick={() => setManual((m) => (m === 1 ? 0 : 1))}
                    className="pressable absolute left-0 bottom-0 border border-mapo-cream/20 px-4 py-2.5 text-[10px] font-display uppercase tracking-label text-mapo-cream hover:border-mapo-accent hover:text-mapo-accent"
                    data-testid="burger-separate-btn"
                  >
                    {manual === 1 ? "Assemble" : "Separate"}
                  </button>
                </div>

                {/* Phone and tablet: the layer list, tappable, under the food. */}
                <ul className="lg:hidden mt-4 border-t border-mapo-cream/10" data-testid="burger-layer-list">
                  {labelRows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setFocusId(focusId === row.id ? null : row.id)}
                        aria-expanded={row.active}
                        className="w-full flex items-baseline justify-between gap-4 py-3 border-b border-mapo-cream/10 text-left"
                        data-testid={`burger-layer-${row.id}`}
                      >
                        <span className={`font-display text-sm ${row.active ? "text-mapo-accent" : "text-mapo-cream"}`}>
                          {row.label}
                          {row.sublabel && <span className="text-mapo-muted text-xs ml-2">{row.sublabel}</span>}
                        </span>
                        {row.macros && (
                          <span className="label tnum shrink-0">{Math.round(row.macros.kcal)} kcal</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ------------------------------------------- the numbers */}
              <div className="lg:pt-4">
                {error ? (
                  <div className="border border-mapo-cream/15 p-5" data-testid="burger-nutrition-error">
                    <p className="label text-mapo-accent">Nutrition unavailable</p>
                    <p className="text-sm text-mapo-muted mt-2 leading-relaxed">
                      The food database did not answer. The burger still comes apart — the
                      figures are withheld rather than guessed at.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-mapo-cream/10 pb-6">
                      <Kcal
                        value={loading ? 0 : total.kcal}
                        label={focused ? `${focused.label}${focused.sublabel ? ` · ${focused.sublabel}` : ""}` : "Your burger"}
                        testId="burger-total-kcal"
                      />
                      <MacroRow
                        macros={focused?.macros ? focused.macros : total}
                        className="mt-6"
                        testId="burger-macros"
                      />
                      <MacroSplit macros={focused?.macros ? focused.macros : total} className="mt-6" />
                      {focused?.macros?.source && (
                        <p className="label mt-4">Source · {focused.macros.source}</p>
                      )}
                    </div>

                    {dish && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between">
                          <p className="label">Change it</p>
                          {dirty && (
                            <button
                              type="button"
                              onClick={reset}
                              className="pressable label hover:text-mapo-accent"
                              data-testid="burger-reset"
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="mt-2">
                          <Stepper
                            label="Patty"
                            count={counts.patty}
                            max={2}
                            delta={deltaFor(components.patty)}
                            onAdd={() => setCount("patty", counts.patty + 1)}
                            onRemove={() => setCount("patty", counts.patty - 1)}
                            testId="burger-step-patty"
                          />
                          <Stepper
                            label="Cheese"
                            count={counts.cheese}
                            max={2}
                            delta={deltaFor(components.cheese)}
                            onAdd={() => setCount("cheese", counts.cheese + 1)}
                            onRemove={() => setCount("cheese", counts.cheese - 1)}
                            testId="burger-step-cheese"
                          />
                          <Stepper
                            label="Sauce"
                            count={counts.sauce}
                            max={1}
                            delta={deltaFor(components.sauce)}
                            onAdd={() => setCount("sauce", 1)}
                            onRemove={() => setCount("sauce", 0)}
                            testId="burger-step-sauce"
                          />
                          {VEG.map((key) => (
                            <Stepper
                              key={key}
                              label={components[key]?.label || key}
                              count={counts[key]}
                              max={1}
                              delta={deltaFor(components[key])}
                              onAdd={() => setCount(key, 1)}
                              onRemove={() => setCount(key, 0)}
                              testId={`burger-step-${key}`}
                            />
                          ))}

                          {dish.variants?.patty && (
                            <ChoiceRow
                              label="Patty"
                              options={dish.variants.patty}
                              value={variants.patty}
                              onChange={(k) => setVariants((v) => ({ ...v, patty: k }))}
                              testId="burger-variant-patty"
                            />
                          )}
                          {dish.variants?.bun && (
                            <ChoiceRow
                              label="Bun"
                              options={dish.variants.bun}
                              value={variants.bun}
                              onChange={(k) => setVariants((v) => ({ ...v, bun: k }))}
                              testId="burger-variant-bun"
                            />
                          )}
                          {dish.variants?.sauce && (
                            <ChoiceRow
                              label="Sauce"
                              options={dish.variants.sauce}
                              value={variants.sauce}
                              onChange={(k) => setVariants((v) => ({ ...v, sauce: k }))}
                              testId="burger-variant-sauce"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!assets.ready && assets.checked && (
                  <p className="label mt-6 leading-relaxed">
                    Rendered as geometry · photoreal layers drop in at /food/burger
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
