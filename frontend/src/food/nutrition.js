/**
 * Composes a dish's nutrition from the components the API priced.
 *
 * Nothing here invents a number. `/api/foods/components` returns per-layer
 * kcal and macros already multiplied out to gram weights, and this only adds
 * them up, applies counts, and applies the size factor for pizza. Keeping the
 * arithmetic to addition and one multiplication is what makes removing an
 * ingredient and adding it back land on exactly the number you started from.
 */

export const EMPTY = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

export function addMacros(a, b, times = 1) {
  return {
    kcal: a.kcal + b.kcal * times,
    protein: a.protein + b.protein * times,
    carbs: a.carbs + b.carbs * times,
    fat: a.fat + b.fat * times,
    fibre: (a.fibre || 0) + (b.fibre || 0) * times,
  };
}

export function scaleMacros(m, factor) {
  return {
    kcal: m.kcal * factor,
    protein: m.protein * factor,
    carbs: m.carbs * factor,
    fat: m.fat * factor,
    fibre: (m.fibre || 0) * factor,
  };
}

export function roundMacros(m) {
  return {
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein),
    carbs: Math.round(m.carbs),
    fat: Math.round(m.fat),
    fibre: Math.round(m.fibre || 0),
  };
}

/**
 * Total a dish given the current per-component counts.
 *
 * `components` is a map of key -> priced component (possibly a swapped
 * variant). `counts` is key -> how many are on the dish; 0 means removed.
 */
export function totalFor(components, counts, factor = 1) {
  let total = { ...EMPTY };
  Object.entries(counts).forEach(([key, count]) => {
    const c = components[key];
    if (!c || !count) return;
    total = addMacros(total, c, count);
  });
  return roundMacros(scaleMacros(total, factor));
}

/** What one more, or one fewer, of a component would cost. Used on the buttons. */
export function deltaFor(component, factor = 1, sign = 1) {
  if (!component) return 0;
  return Math.round(component.kcal * factor) * sign;
}

/** Percentage split of energy across the three macros, for the macro bar. */
export function energySplit(m) {
  const p = m.protein * 4;
  const c = m.carbs * 4;
  const f = m.fat * 9;
  const sum = p + c + f;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: (p / sum) * 100,
    carbs: (c / sum) * 100,
    fat: (f / sum) * 100,
  };
}
