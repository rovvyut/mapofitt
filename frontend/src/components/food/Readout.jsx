/**
 * The numeric vocabulary shared by both food experiences.
 *
 * Numbers are the loudest thing on these screens after the food itself, so
 * they get display type, tabular figures and an eased transition. Everything
 * around them — labels, units, rules — stays quiet and small.
 */
import useCountUp from "@/hooks/useCountUp";
import { energySplit } from "@/food/nutrition";

export function Kcal({ value, label = "Total", size = "lg", testId }) {
  const shown = useCountUp(value);
  const cls = size === "lg" ? "text-num-lg" : size === "md" ? "text-num-md" : "text-num-sm";
  return (
    <div data-testid={testId}>
      {label && <p className="label mb-2">{label}</p>}
      <p className={`font-display ${cls} tnum text-mapo-cream leading-none`}>
        {shown.toLocaleString()}
        <span className="ml-2 font-body text-base font-medium tracking-normal text-mapo-muted align-baseline">
          kcal
        </span>
      </p>
    </div>
  );
}

export function MacroFigure({ label, value, unit = "g", accent = false, testId }) {
  const shown = useCountUp(value);
  return (
    <div data-testid={testId}>
      <p className={`font-display text-num-sm tnum leading-none ${accent ? "text-mapo-accent" : "text-mapo-cream"}`}>
        {shown}
        <span className="font-body text-xs font-medium tracking-normal text-mapo-muted">{unit}</span>
      </p>
      <p className="label mt-1.5">{label}</p>
    </div>
  );
}

export function MacroRow({ macros, className = "", testId }) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`} data-testid={testId}>
      <MacroFigure label="Protein" value={macros.protein} testId="macro-protein" />
      <MacroFigure label="Carbs" value={macros.carbs} testId="macro-carbs" />
      <MacroFigure label="Fat" value={macros.fat} testId="macro-fat" />
    </div>
  );
}

/**
 * How the dish's energy is split across the three macros.
 *
 * Three solid segments on one rule — not a pie, not a stacked gradient bar.
 * The proportion is the only thing being said, so it is the only thing drawn,
 * and every segment carries a text percentage because colour alone is not an
 * accessible way to tell someone their meal is mostly fat.
 */
export function MacroSplit({ macros, className = "" }) {
  const split = energySplit(macros);
  const segments = [
    { key: "protein", label: "Protein", pct: split.protein, color: "#F5F1EA" },
    { key: "carbs", label: "Carbs", pct: split.carbs, color: "#E9B949" },
    { key: "fat", label: "Fat", pct: split.fat, color: "#8F877C" },
  ];

  return (
    <div className={className}>
      <div
        className="flex h-[3px] w-full overflow-hidden"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${Math.round(s.pct)} percent of energy`).join(", ")}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${s.pct}%`, background: s.color }}
            className="transition-[width] duration-500 ease-out"
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {segments.map((s) => (
          <span key={s.key} className="label">
            {s.label} {Math.round(s.pct)}%
          </span>
        ))}
      </div>
    </div>
  );
}

/** A +/- stepper. Used for cheese, patties and every pizza topping. */
export function Stepper({ label, sublabel, count, max = 2, delta, onAdd, onRemove, swatch, testId }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-mapo-cream/10 last:border-b-0" data-testid={testId}>
      {swatch && (
        <span
          className="h-7 w-7 shrink-0 border border-mapo-cream/15"
          style={{ background: swatch }}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-mapo-cream truncate">{label}</p>
        <p className="label mt-0.5">
          {sublabel || (delta > 0 ? `+${delta} kcal each` : `${delta} kcal`)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onRemove}
          disabled={count === 0}
          aria-label={`Remove ${label}`}
          className="pressable h-9 w-9 grid place-items-center border border-mapo-cream/15 text-mapo-cream disabled:opacity-25 disabled:cursor-not-allowed hover:border-mapo-accent hover:text-mapo-accent"
          data-testid={testId ? `${testId}-minus` : undefined}
        >
          <span aria-hidden="true">–</span>
        </button>
        <span className="w-8 text-center font-display text-sm tnum text-mapo-cream" data-testid={testId ? `${testId}-count` : undefined}>
          {count}
        </span>
        <button
          type="button"
          onClick={onAdd}
          disabled={count >= max}
          aria-label={`Add ${label}`}
          className="pressable h-9 w-9 grid place-items-center border border-mapo-cream/15 text-mapo-cream disabled:opacity-25 disabled:cursor-not-allowed hover:border-mapo-accent hover:text-mapo-accent"
          data-testid={testId ? `${testId}-plus` : undefined}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}

/** A row of mutually exclusive choices — bun type, sauce, pizza size. */
export function ChoiceRow({ label, options, value, onChange, testId }) {
  return (
    <div className="py-3 border-b border-mapo-cream/10 last:border-b-0" data-testid={testId}>
      <p className="label mb-2">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const on = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(opt.key)}
              className={`pressable px-3 py-2 text-xs font-display border ${
                on
                  ? "border-mapo-accent text-mapo-accent"
                  : "border-mapo-cream/15 text-mapo-muted hover:text-mapo-cream hover:border-mapo-cream/35"
              }`}
              data-testid={testId ? `${testId}-${opt.key}` : undefined}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
