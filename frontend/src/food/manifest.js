/**
 * Visual manifest for the two food experiences.
 *
 * This is the seam that lets photoreal artwork replace the built-in geometry
 * without touching a line of interaction code. Every layer declares:
 *
 *   image   — where its transparent PNG lives, if one has been supplied
 *   build   — how to draw it as geometry when that PNG is absent
 *
 * `useLayerAssets` probes the image paths once at mount. If a set loads, the
 * scene renders textured planes; if it 404s, the same scene renders the
 * geometry instead. Explode offsets, labels, ordering, hit targets and the
 * nutrition wiring are shared by both paths, so the two look different but
 * behave identically.
 *
 * Asset spec, if you are generating the PNGs:
 *   · 2048 px wide, transparent background, one ingredient per file
 *   · identical camera and lighting across a set
 *   · burger: straight-on three-quarter view; pizza: top-down
 *   · the ingredient centred, occupying ~90% of the frame width
 *
 * `nutritionKey` maps a visual layer onto a component from
 * /api/foods/components. Several visual layers may share one key — a burger
 * has two sauce passes and two bun halves but is priced once for each.
 */

// Layer colours for the geometry path. Warm, desaturated, food-plausible —
// and deliberately never the interface accent, or a layer would read as a
// piece of UI rather than a piece of food.
export const MATTE = {
  bunTop: "#C98A45",
  bunBottom: "#BE7F3D",
  patty: "#6B4426",
  cheese: "#D98426",
  lettuce: "#6E8F3A",
  tomato: "#B22B20",
  onion: "#8E5C77",
  sauce: "#E8CFA0",
  dough: "#E4C795",
  pizzaSauce: "#A82A18",
  mozzarella: "#F0DFAE",
  paneer: "#F2E6CE",
  chicken: "#9C4A22",
  capsicum: "#4E7A32",
  mushroom: "#C4A585",
  corn: "#E0B23C",
  olive: "#2C2A2C",
  jalapeno: "#5E8A32",
};

/**
 * A burger, ordered top of the stack downward — the order the exploded
 * column reads in. `y` is the resting height of the layer; `explode` is how
 * far it travels when the stack opens.
 */
export const BURGER_LAYERS = [
  { id: "bun-top", t: 0.62,       nutritionKey: "bun",    label: "Bun",        sublabel: "Crown",  y: 1.02, explode: 3.30, image: "/food/burger/bun-top.png",       build: { kind: "bunTop",  r: 1.55, color: MATTE.bunTop } },
  { id: "sauce-top", t: 0.1,     nutritionKey: "sauce",  label: "Sauce",      sublabel: "Top",    y: 0.74, explode: 2.45, image: "/food/burger/sauce-top.png",     build: { kind: "spread",  r: 1.38, h: 0.10, color: MATTE.sauce } },
  { id: "lettuce", t: 0.2,       nutritionKey: "lettuce",    label: "Lettuce",    sublabel: "",       y: 0.58, explode: 1.85, image: "/food/burger/lettuce.png",       build: { kind: "ruffle",  r: 1.46, color: MATTE.lettuce } },
  { id: "onion", t: 0.15,         nutritionKey: "onion",    label: "Onion",      sublabel: "",       y: 0.44, explode: 1.30, image: "/food/burger/onion.png",         build: { kind: "rings",   r: 1.18, color: MATTE.onion } },
  { id: "tomato", t: 0.13,        nutritionKey: "tomato",    label: "Tomato",     sublabel: "",       y: 0.30, explode: 0.80, image: "/food/burger/tomato.png",        build: { kind: "slices",  r: 0.5, color: MATTE.tomato } },
  { id: "cheese", t: 0.11,        nutritionKey: "cheese", label: "Cheese",     sublabel: "Cheddar",y: 0.16, explode: 0.28, image: "/food/burger/cheese.png",        build: { kind: "slab",    r: 1.42, color: MATTE.cheese } },
  { id: "patty", t: 0.5,         nutritionKey: "patty",  label: "Patty",      sublabel: "",       y: -0.10, explode: -0.35, image: "/food/burger/patty.png",        build: { kind: "patty",   r: 1.56, h: 0.46, color: MATTE.patty } },
  { id: "sauce-bottom", t: 0.1,  nutritionKey: "sauce",  label: "Sauce",      sublabel: "Base",   y: -0.38, explode: -1.05, image: "/food/burger/sauce-bottom.png", build: { kind: "spread",  r: 1.38, h: 0.10, color: MATTE.sauce } },
  { id: "bun-bottom", t: 0.48,    nutritionKey: "bun",    label: "Bun",        sublabel: "Heel",   y: -0.62, explode: -1.85, image: "/food/burger/bun-bottom.png",   build: { kind: "bunBase", r: 1.55, color: MATTE.bunBottom } },
];

/**
 * A pizza, ordered bottom upward — the order it is actually built in, which
 * is what the construction sequence steps through.
 */
export const PIZZA_LAYERS = [
  { id: "base",     nutritionKey: "base",   label: "Base",     step: 1, y: 0.00, explode: -0.55, image: "/food/pizza/base.png",     build: { kind: "disc",     r: 3.0,  h: 0.34, color: MATTE.dough } },
  { id: "sauce",    nutritionKey: "sauce",  label: "Sauce",    step: 2, y: 0.20, explode: 0.55,  image: "/food/pizza/sauce.png",    build: { kind: "disc",     r: 2.78, h: 0.08, color: MATTE.pizzaSauce } },
  { id: "cheese",   nutritionKey: "cheese", label: "Cheese",   step: 3, y: 0.30, explode: 1.45,  image: "/food/pizza/cheese.png",   build: { kind: "shred",    r: 2.70, color: MATTE.mozzarella } },
  { id: "toppings", nutritionKey: null,     label: "Toppings", step: 4, y: 0.42, explode: 2.45,  image: "/food/pizza/toppings.png", build: { kind: "toppings", r: 2.55 } },
];


/**
 * Builds the actual list of visual layers for a burger at the current counts,
 * and stacks them so the thing keeps sitting on the plate.
 *
 * A second patty or a second cheese slice is a real extra layer, not a taller
 * one — the stack grows upward from a fixed heel, which is how a burger
 * behaves and, more practically, keeps the contact shadow from sliding around
 * when you add something. Explode travel is assigned from each layer's
 * distance above the heel so the separation fans out evenly however many
 * layers there happen to be.
 */
export function stackBurger(counts = {}) {
  const present = [];
  // Walk bottom-to-top: the array is authored top-down, so reverse it.
  [...BURGER_LAYERS].reverse().forEach((layer) => {
    const key = layer.nutritionKey;
    if ((counts[key] ?? 1) < 1) return;

    present.push(layer);
    if (layer.id === "patty" && (counts.patty ?? 1) > 1) {
      present.push({ ...layer, id: "patty-2", sublabel: "Second" });
    }
    if (layer.id === "cheese" && (counts.cheese ?? 1) > 1) {
      present.push({ ...layer, id: "cheese-2", sublabel: "Second" });
    }
  });

  const HEEL = -1.35;
  let cursor = HEEL;
  const stacked = present.map((layer) => {
    const half = (layer.t ?? 0.2) / 2;
    cursor += half;
    const placed = { ...layer, y: cursor };
    cursor += half;
    return placed;
  });

  // Fan the separation out from the middle of whatever stack we ended up with.
  const n = stacked.length || 1;
  const withExplode = stacked.map((layer, i) => ({
    ...layer,
    explode: (i - (n - 1) / 2) * 0.56,
  }));

  // Hand it back top-down, which is the order the labels read in.
  return withExplode.reverse();
}

/** Geometry recipe for one topping type, keyed by the component key. */
export const TOPPING_STYLE = {
  paneer:   { kind: "cube",  size: 0.30, color: MATTE.paneer,   count: 7 },
  chicken:  { kind: "cube",  size: 0.30, color: MATTE.chicken,  count: 7 },
  capsicum: { kind: "ring",  size: 0.26, color: MATTE.capsicum, count: 8 },
  mushroom: { kind: "dome",  size: 0.24, color: MATTE.mushroom, count: 7 },
  corn:     { kind: "bead",  size: 0.11, color: MATTE.corn,     count: 16 },
  olive:    { kind: "ring",  size: 0.20, color: MATTE.olive,    count: 9 },
  jalapeno: { kind: "ring",  size: 0.17, color: MATTE.jalapeno, count: 8 },
};

export const DISH_MANIFEST = {
  burger: { layers: BURGER_LAYERS, view: "three-quarter", camera: [0, 2.6, 14], fov: 36 },
  pizza:  { layers: PIZZA_LAYERS,  view: "top-down",      camera: [0, 12.4, 6.8], fov: 32 },
};

/** Every image path a dish would use, for the existence probe. */
export function imagePathsFor(dishKey) {
  const dish = DISH_MANIFEST[dishKey];
  if (!dish) return [];
  return dish.layers.map((l) => l.image).filter(Boolean);
}
