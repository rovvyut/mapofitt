/**
 * PIZZA — BUILDER
 *
 * The burger takes a finished thing apart. The pizza does the opposite: it
 * gets built, one layer at a time, and the number climbs as it goes. Same
 * scene engine, same nutrition source, deliberately the opposite gesture — a
 * second deconstruction would have been the same idea twice.
 *
 * Scroll walks the six steps on its own. Clicking a step takes over, because
 * an animation you can only watch is a video, not an interface.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FoodStack from "@/food/FoodStack";
import { DISH_MANIFEST, PIZZA_LAYERS, MATTE, TOPPING_STYLE } from "@/food/manifest";
import useDishComponents from "@/food/useDishComponents";
import useLayerAssets from "@/food/useLayerAssets";
import useScrollProgress from "@/hooks/useScrollProgress";
import useReducedMotion from "@/hooks/useReducedMotion";
import useMediaQuery from "@/hooks/useMediaQuery";
import useInView from "@/hooks/useInView";
import { totalFor, deltaFor } from "@/food/nutrition";
import { Kcal, MacroRow, MacroSplit, Stepper, ChoiceRow } from "./Readout";

const STEPS = [
  { key: "base", label: "Base", note: "A 9-inch hand-tossed round." },
  { key: "sauce", label: "Sauce", note: "Tomato, spread to the edge." },
  { key: "cheese", label: "Cheese", note: "Mozzarella, grated over the sauce." },
  { key: "toppings", label: "Toppings", note: "Whatever you put on it, priced as you go." },
  { key: "bake", label: "Bake", note: "The cheese takes colour. Nothing else changes." },
  { key: "done", label: "Yours", note: "One pizza. One honest number." },
];

const DEFAULT_TOPPINGS = { paneer: 0, chicken: 0, capsicum: 1, mushroom: 1, corn: 0, olive: 1, jalapeno: 0 };

export default function PizzaBuilder() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { phase } = useScrollProgress(sectionRef, { steps: STEPS.length });
  const stageInView = useInView(stageRef, { threshold: 0.4 });

  // Same reasoning as the burger: scroll scrubs the build on a desktop, and on
  // a phone it plays itself once when you arrive, then hands you the controls.
  const cinematic = isDesktop && !reduced;
  const { dish, loading, error } = useDishComponents("pizza");
  const assets = useLayerAssets("pizza");

  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false); // a click takes scroll off the wheel
  const [counts, setCounts] = useState({ base: 1, sauce: 1, cheese: 1 });
  const [toppings, setToppings] = useState(DEFAULT_TOPPINGS);
  const [size, setSize] = useState("medium");
  const [baseVariant, setBaseVariant] = useState("pizza_base");

  // Scroll walks the steps until someone takes over. `phase` already only
  // changes when the step changes, so this costs one render per step rather
  // than one per frame.
  useEffect(() => {
    if (pinned || !cinematic) return;
    setStep(phase);
  }, [phase, pinned, cinematic]);

  // Phone: play the six steps through once, at reading pace, on arrival.
  useEffect(() => {
    if (cinematic || pinned || !stageInView) return undefined;
    if (reduced) {
      setStep(STEPS.length - 1);
      return undefined;
    }
    let i = 0;
    setStep(0);
    const id = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= STEPS.length - 1) clearInterval(id);
    }, 780);
    return () => clearInterval(id);
  }, [cinematic, pinned, stageInView, reduced]);

  const baked = step >= 4;

  const sizeFactor = useMemo(
    () => dish?.sizes?.find((s) => s.key === size)?.factor ?? 1,
    [dish, size]
  );

  // ---------------------------------------------------------------- data
  const components = useMemo(() => {
    if (!dish) return {};
    const byKey = {};
    dish.layers.forEach((l) => {
      byKey[l.key] = l;
    });
    (dish.toppings || []).forEach((t) => {
      byKey[t.key] = t;
    });
    const opt = (dish.variants?.base || []).find((o) => o.key === baseVariant);
    if (opt && byKey.base) byKey.base = { ...byKey.base, ...opt, label: "Base", note: opt.label };
    return byKey;
  }, [dish, baseVariant]);

  /** Only what has actually been added by the current step counts toward the total. */
  const activeCounts = useMemo(() => {
    const out = {};
    if (step >= 0) out.base = counts.base;
    if (step >= 1) out.sauce = counts.sauce;
    if (step >= 2) out.cheese = counts.cheese;
    if (step >= 3) Object.entries(toppings).forEach(([k, n]) => { if (n) out[k] = n; });
    return out;
  }, [step, counts, toppings]);

  const total = useMemo(
    () => totalFor(components, activeCounts, sizeFactor),
    [components, activeCounts, sizeFactor]
  );

  /** The finished pizza's number, regardless of which step is showing. */
  const finalTotal = useMemo(() => {
    const all = { ...counts };
    Object.entries(toppings).forEach(([k, n]) => { if (n) all[k] = n; });
    return totalFor(components, all, sizeFactor);
  }, [components, counts, toppings, sizeFactor]);

  // ------------------------------------------------------------- visuals
  const layers = useMemo(() => {
    return PIZZA_LAYERS.map((layer) => {
      const visible = step >= layer.step - 1 && (counts[layer.nutritionKey] ?? 1) > 0;
      // Baking is a colour change, not a new asset: the cheese goes from raw
      // shred to melted and the crust takes an edge.
      let build = layer.build;
      if (baked && layer.id === "cheese") build = { ...build, kind: "melt", color: "#E8C87C" };
      if (baked && layer.id === "base") build = { ...build, color: "#C99A56" };
      return { ...layer, build, visible };
    });
  }, [step, counts, baked]);

  const toppingList = useMemo(
    () => Object.entries(toppings).map(([key, count]) => ({ key, count })),
    [toppings]
  );

  // Layers lift apart while you are building and settle once it is baked.
  const explodeRef = useMemo(
    () => ({ get current() { return step >= 4 ? 0 : 1; } }),
    [step]
  );

  const goto = useCallback((i) => {
    setPinned(true);
    setStep(i);
  }, []);

  const setTopping = useCallback((key, next) => {
    setToppings((t) => ({ ...t, [key]: Math.max(0, Math.min(2, next)) }));
    // Adding a topping while the pizza is still bare is a request to see it.
    setStep((s) => (s < 3 ? 3 : s));
    setPinned(true);
  }, []);

  const perToppingDelta = useCallback(
    (key) => deltaFor(components[key], sizeFactor),
    [components, sizeFactor]
  );

  return (
    <section
      ref={sectionRef}
      id="pizza"
      aria-labelledby="pizza-heading"
      className="relative z-10"
      style={{ minHeight: cinematic ? "320vh" : "auto" }}
      data-testid="pizza-section"
    >
      <div className={cinematic ? "sticky top-0" : ""}>
        <div className={`flex flex-col justify-center py-10 ${cinematic ? "min-h-screen" : ""}`}>
          <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
            <header className="flex flex-wrap items-end justify-between gap-6 border-b border-mapo-cream/10 pb-6">
              <div>
                <p className="label">03 — Build it and watch it cost you</p>
                <h2 id="pizza-heading" className="font-display text-display-sm text-mapo-cream mt-3">
                  Pizza
                  <span className="block text-mapo-accent">Builder</span>
                </h2>
              </div>
              <div className="max-w-sm">
                <p className="label text-mapo-accent">{STEPS[step].label}</p>
                <p className="text-mapo-muted text-sm leading-relaxed mt-2">{STEPS[step].note}</p>
              </div>
            </header>

            <div className="grid lg:grid-cols-[auto_1.4fr_1fr] gap-8 lg:gap-12 mt-8">
              {/* ------------------------------------------- the step rail */}
              <ol
                className="flex lg:flex-col gap-1 lg:gap-0 overflow-x-auto hide-scrollbar lg:overflow-visible"
                data-testid="pizza-steps"
              >
                {STEPS.map((s, i) => {
                  const on = i === step;
                  const done = i < step;
                  return (
                    <li key={s.key} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => goto(i)}
                        aria-current={on ? "step" : undefined}
                        className="pressable flex items-center gap-3 py-2.5 pr-5 text-left w-full"
                        data-testid={`pizza-step-${s.key}`}
                      >
                        <span
                          className={`h-6 w-6 shrink-0 grid place-items-center text-[10px] font-display tnum border ${
                            on
                              ? "border-mapo-accent text-mapo-accent"
                              : done
                              ? "border-mapo-cream/30 text-mapo-cream/50"
                              : "border-mapo-cream/12 text-mapo-cream/25"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={`font-display text-xs uppercase tracking-label ${
                            on ? "text-mapo-cream" : done ? "text-mapo-muted" : "text-mapo-cream/25"
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* ------------------------------------------- the object */}
              <div ref={stageRef} className="relative h-[42vh] min-h-[290px] lg:h-[56vh]">
                <FoodStack
                  className="absolute inset-0"
                  layers={layers}
                  camera={DISH_MANIFEST.pizza.camera}
                  fov={DISH_MANIFEST.pizza.fov}
                  flat
                  useImages={assets.ready}
                  explodeRef={explodeRef}
                  toppings={toppingList}
                  onFocus={() => {}}
                  showShadow={false}
                />
                {pinned && cinematic && (
                  <button
                    type="button"
                    onClick={() => setPinned(false)}
                    className="pressable absolute left-0 bottom-0 label hover:text-mapo-accent"
                    data-testid="pizza-resume-scroll"
                  >
                    ↻ Follow scroll again
                  </button>
                )}
              </div>

              {/* ------------------------------------------- the numbers */}
              <div className="lg:pt-4">
                {error ? (
                  <div className="border border-mapo-cream/15 p-5" data-testid="pizza-nutrition-error">
                    <p className="label text-mapo-accent">Nutrition unavailable</p>
                    <p className="text-sm text-mapo-muted mt-2 leading-relaxed">
                      The food database did not answer, so the figures are withheld rather
                      than guessed at. The builder still works.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-mapo-cream/10 pb-6">
                      <Kcal
                        value={loading ? 0 : total.kcal}
                        label={step >= 5 ? "Your pizza" : `So far · through ${STEPS[step].label}`}
                        testId="pizza-total-kcal"
                      />
                      <MacroRow macros={total} className="mt-6" testId="pizza-macros" />
                      <MacroSplit macros={total} className="mt-6" />
                      {step < 5 && finalTotal.kcal !== total.kcal && (
                        <p className="label mt-4 tnum">
                          Finished · {finalTotal.kcal.toLocaleString()} kcal
                        </p>
                      )}
                    </div>

                    {dish && (
                      <div className="mt-6">
                        <p className="label">Change it</p>
                        <div className="mt-2 max-h-[32vh] overflow-y-auto hide-scrollbar pr-1">
                          <Stepper
                            label="Cheese"
                            count={counts.cheese}
                            max={2}
                            delta={deltaFor(components.cheese, sizeFactor)}
                            onAdd={() => setCounts((c) => ({ ...c, cheese: Math.min(2, c.cheese + 1) }))}
                            onRemove={() => setCounts((c) => ({ ...c, cheese: Math.max(0, c.cheese - 1) }))}
                            swatch={MATTE.mozzarella}
                            testId="pizza-step-cheese"
                          />
                          {(dish.toppings || []).map((t) => (
                            <Stepper
                              key={t.key}
                              label={t.label}
                              count={toppings[t.key] ?? 0}
                              max={2}
                              delta={perToppingDelta(t.key)}
                              onAdd={() => setTopping(t.key, (toppings[t.key] ?? 0) + 1)}
                              onRemove={() => setTopping(t.key, (toppings[t.key] ?? 0) - 1)}
                              swatch={TOPPING_STYLE[t.key]?.color}
                              testId={`pizza-topping-${t.key}`}
                            />
                          ))}
                          {dish.variants?.base && (
                            <ChoiceRow
                              label="Base"
                              options={dish.variants.base}
                              value={baseVariant}
                              onChange={setBaseVariant}
                              testId="pizza-variant-base"
                            />
                          )}
                          {dish.sizes && (
                            <ChoiceRow
                              label="Size"
                              options={dish.sizes}
                              value={size}
                              onChange={setSize}
                              testId="pizza-size"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!assets.ready && assets.checked && (
                  <p className="label mt-6 leading-relaxed">
                    Rendered as geometry · photoreal layers drop in at /food/pizza
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
