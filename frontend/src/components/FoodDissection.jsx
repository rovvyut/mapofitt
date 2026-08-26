/**
 * FoodDissection — 3D exploded views that break a dish into its macros.
 *
 * Deliberately cel-shaded, not photoreal: flat toon colour plus a hard black
 * outline on every mesh, so it reads as the same poster graphic as the rest of
 * the site rather than a glossy render. No environment map, no bloom.
 *
 * Colour rule: nothing is painted the panel's yellow, or it melts into the
 * background. Carbs cream, protein brown, fat deep orange, tomato red. Every
 * layer also carries a text label, so meaning never depends on colour alone.
 *
 * Drag to rotate. Tap to pull the layers apart.
 */
import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DoubleSide } from "three";

const CREAM = "#FFF3D0";
const WHITE = "#FFFFFF";
const BROWN = "#7A3E12";
const CHEESE = "#D2600A";
const NOODLE = "#FF8A00";
const TOMATO = "#E2231A";
const PEPPERONI = "#D62B1F";
const BLACK = "#0B0B0B";

// How far layers travel when open. One knob for all dishes.
const SPREAD = 0.62;

/** A flat-shaded mesh with a hard black rim. */
function Part({ color, doubleSided = false, children, ...props }) {
  return (
    <mesh castShadow={false} receiveShadow={false} {...props}>
      {children}
      <meshToonMaterial color={color} side={doubleSided ? DoubleSide : undefined} />
    </mesh>
  );
}

/** One macro layer: slides to `offset` when the dish is open. */
function Layer({ offset = [0, 0, 0], open, children }) {
  const g = useRef();
  useFrame((_, dt) => {
    if (!g.current) return;
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent easing
    const [x, y, z] = open ? offset.map((v) => v * SPREAD) : [0, 0, 0];
    g.current.position.x += (x - g.current.position.x) * k;
    g.current.position.y += (y - g.current.position.y) * k;
    g.current.position.z += (z - g.current.position.z) * k;
  });
  return <group ref={g}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Dishes
// ---------------------------------------------------------------------------

function Burger({ open }) {
  return (
    <group>
      <Layer open={open} offset={[0, 2.2, 0]}>
        <Part color={CREAM} position={[0, 1.05, 0]} scale={[1, 0.62, 1]}>
          <sphereGeometry args={[1.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </Part>
        <Part color={CREAM} position={[0, 0.86, 0]}>
          <cylinderGeometry args={[1.55, 1.5, 0.34, 32]} />
        </Part>
      </Layer>

      <Layer open={open} offset={[0, 1.1, 0]}>
        <Part color={CHEESE} position={[0, 0.6, 0]} rotation={[0, Math.PI / 8, 0]}>
          <boxGeometry args={[2.85, 0.16, 2.85]} />
        </Part>
      </Layer>

      <Layer open={open} offset={[0, 0.3, 0]}>
        {[[-0.85, 0, 0.3], [0.85, 0, -0.3], [0, 0, 0.9]].map(([x, , z], i) => (
          <Part key={i} color={TOMATO} position={[x, 0.4, z]}>
            <cylinderGeometry args={[0.62, 0.62, 0.13, 24]} />
          </Part>
        ))}
      </Layer>

      <Layer open={open} offset={[0, -0.7, 0]}>
        <Part color={BROWN} position={[0, 0.06, 0]}>
          <cylinderGeometry args={[1.62, 1.62, 0.5, 32]} />
        </Part>
      </Layer>

      <Layer open={open} offset={[0, -1.7, 0]}>
        <Part color={CREAM} position={[0, -0.52, 0]}>
          <cylinderGeometry args={[1.55, 1.35, 0.62, 32]} />
        </Part>
      </Layer>
    </group>
  );
}

function Momo({ open }) {
  // Two wrapper halves that part to reveal the filling — a cut-open momo.
  const half = (sign) => (
    <Part
      color={WHITE}
      doubleSided
      position={[0, 0.55, 0]}
      rotation={[0, sign > 0 ? 0 : Math.PI, 0]}
      scale={[1, 1.15, 1]}
    >
      <sphereGeometry args={[1.5, 28, 18, 0, Math.PI, 0, Math.PI / 2]} />
    </Part>
  );
  return (
    <group>
      <Layer open={open} offset={[1.9, 0.4, 0]}>
        {half(1)}
      </Layer>
      <Layer open={open} offset={[-1.9, 0.4, 0]}>{half(-1)}</Layer>

      <Layer open={open} offset={[0, 0.15, 0]}>
        <Part color={BROWN} position={[0, 0.5, 0]} scale={[1, 0.72, 1]}>
          <sphereGeometry args={[1.12, 26, 18]} />
        </Part>
        {[[TOMATO, -0.5, 0.55], [NOODLE, 0.15, 0.75], [CREAM, 0.55, 0.4]].map(([c, x, z], i) => (
          <Part key={i} color={c} position={[x, 0.95, z]}>
            <sphereGeometry args={[0.19, 14, 10]} />
          </Part>
        ))}
      </Layer>

      <Layer open={open} offset={[0, -1.5, 0]}>
        <Part color={CREAM} position={[0, -0.3, 0]}>
          <cylinderGeometry args={[2.05, 1.9, 0.3, 40]} />
        </Part>
      </Layer>
    </group>
  );
}

function Pizza({ open }) {
  // cylinderGeometry with a partial thetaLength gives a true triangular wedge.
  const WEDGE = [0, 0, false, Math.PI * 0.18, Math.PI * 0.46];
  return (
    <group rotation={[0, -Math.PI * 0.4, 0]}>
      <Layer open={open} offset={[0, 2.1, 0]}>
        {[[-0.5, 1.5], [0.75, 1.15], [0.1, 2.35]].map(([x, z], i) => (
          <Part key={i} color={PEPPERONI} position={[x, 0.62, z]}>
            <cylinderGeometry args={[0.42, 0.42, 0.14, 20]} />
          </Part>
        ))}
      </Layer>

      <Layer open={open} offset={[0, 1.15, 0]}>
        <Part color={CHEESE} position={[0, 0.45, 0]}>
          <cylinderGeometry args={[2.7, 2.7, 0.16, 40, 1, ...WEDGE.slice(2)]} />
        </Part>
      </Layer>

      <Layer open={open} offset={[0, 0.35, 0]}>
        <Part color={TOMATO} position={[0, 0.29, 0]}>
          <cylinderGeometry args={[2.85, 2.85, 0.14, 40, 1, ...WEDGE.slice(2)]} />
        </Part>
      </Layer>

      <Layer open={open} offset={[0, -1.1, 0]}>
        <Part color={CREAM} position={[0, 0, 0]}>
          <cylinderGeometry args={[3.05, 3.05, 0.42, 40, 1, ...WEDGE.slice(2)]} />
        </Part>
      </Layer>
    </group>
  );
}

function ButterChicken({ open }) {
  return (
    <group>
      <Layer open={open} offset={[0, 2.0, 0]}>
        {[[-0.75, 0.35], [0.6, -0.5], [0.15, 0.8]].map(([x, z], i) => (
          <Part key={i} color={BROWN} position={[x, 0.42, z]} rotation={[0, i * 0.7, 0]}>
            <boxGeometry args={[0.75, 0.5, 0.62]} />
          </Part>
        ))}
      </Layer>

      <Layer open={open} offset={[0, 0.9, 0]}>
        <Part color={CHEESE} position={[0, 0.12, 0]}>
          <cylinderGeometry args={[1.95, 1.75, 0.55, 40]} />
        </Part>
      </Layer>

      <Layer open={open} offset={[0, -1.2, 0]}>
        <Part color={CREAM} doubleSided position={[0, -0.4, 0]}>
          <cylinderGeometry args={[2.3, 1.5, 0.85, 40, 1, true]} />
        </Part>
        <Part color={CREAM} position={[0, -0.8, 0]}>
          <cylinderGeometry args={[1.5, 1.4, 0.12, 40]} />
        </Part>
      </Layer>
    </group>
  );
}

function Noodles({ open }) {
  const strands = useMemo(
    () => [
      [0, 0.42, 0, 0.25],
      [0.35, 0.62, -0.2, -0.4],
      [-0.3, 0.8, 0.25, 0.7],
    ],
    []
  );
  return (
    <group>
      <Layer open={open} offset={[0, 2.1, 0]}>
        {[[-0.7, 0.4], [0.65, -0.35]].map(([x, z], i) => (
          <Part key={i} color={BROWN} position={[x, 1.35, z]} rotation={[0, i * 0.8, 0]}>
            <boxGeometry args={[0.72, 0.46, 0.6]} />
          </Part>
        ))}
        {[[0.1, 0.85], [-0.55, -0.5]].map(([x, z], i) => (
          <Part key={`c${i}`} color={TOMATO} position={[x, 1.25, z]}>
            <sphereGeometry args={[0.26, 14, 10]} />
          </Part>
        ))}
      </Layer>

      <Layer open={open} offset={[0, 0.85, 0]}>
        {strands.map(([x, y, z, rot], i) => (
          <Part
            key={i}
            color={NOODLE}
            position={[x, y, z]}
            rotation={[Math.PI / 2 - 0.35, rot, 0]}
          >
            <torusGeometry args={[1.15 - i * 0.12, 0.16, 10, 34]} />
          </Part>
        ))}
      </Layer>

      <Layer open={open} offset={[0, -1.3, 0]}>
        <Part color={CREAM} doubleSided position={[0, -0.35, 0]}>
          <cylinderGeometry args={[2.25, 1.45, 0.9, 40, 1, true]} />
        </Part>
        <Part color={CREAM} position={[0, -0.78, 0]}>
          <cylinderGeometry args={[1.45, 1.35, 0.12, 40]} />
        </Part>
      </Layer>
    </group>
  );
}

const MODELS = {
  burger: { name: "Burger", Model: Burger, legend: [
    { sw: CREAM, label: "Bun · Carbs", k: "carbs" },
    { sw: BROWN, label: "Patty · Protein", k: "protein" },
    { sw: CHEESE, label: "Cheese · Fat", k: "fat" }] },
  momo: { name: "Momo", Model: Momo, legend: [
    { sw: CREAM, label: "Base · Carbs", k: "carbs" },
    { sw: BROWN, label: "Filling · Protein", k: "protein" },
    { sw: WHITE, label: "Wrapper · Fat", k: "fat" }] },
  pizza: { name: "Pizza", Model: Pizza, legend: [
    { sw: CREAM, label: "Crust · Carbs", k: "carbs" },
    { sw: PEPPERONI, label: "Pepperoni · Protein", k: "protein" },
    { sw: CHEESE, label: "Cheese · Fat", k: "fat" }] },
  butterChicken: { name: "Butter Chicken", Model: ButterChicken, legend: [
    { sw: CREAM, label: "Naan · Carbs", k: "carbs" },
    { sw: BROWN, label: "Chicken · Protein", k: "protein" },
    { sw: CHEESE, label: "Gravy · Fat", k: "fat" }] },
  noodles: { name: "Noodles", Model: Noodles, legend: [
    { sw: NOODLE, label: "Noodles · Carbs", k: "carbs" },
    { sw: BROWN, label: "Meat · Protein", k: "protein" },
    { sw: CHEESE, label: "Oil · Fat", k: "fat" }] },
};

export const DISH_KEYS = Object.keys(MODELS);

export default function FoodDissection({
  dish = "burger",
  macros = null,
  title = null,
  height = 340,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const spec = MODELS[dish] || MODELS.burger;
  const { Model } = spec;

  return (
    <div className={`bg-mapo-yellow border-[5px] border-mapo-black p-6 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-3xl sm:text-4xl text-mapo-black">{title || spec.name}</h3>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-pressed={open}
          className="shrink-0 border-[3px] border-mapo-black bg-mapo-black text-mapo-yellow px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]"
          data-testid={`dissect-toggle-${dish}`}
        >
          {open ? "Close" : "Dissect"}
        </button>
      </div>

      <div
        className="mt-3 border-[3px] border-mapo-black cursor-pointer"
        style={{ height }}
        onClick={() => setOpen((o) => !o)}
        data-testid={`dissect-canvas-${dish}`}
      >
        <Canvas
          camera={{ position: [5.4, 3.4, 5.4], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          style={{ background: "#FFD400" }}
        >
          {/* Flat, even light. No environment map — that is what makes
              these renders look plasticky. */}
          <ambientLight intensity={2.1} />
          <directionalLight position={[4, 8, 5]} intensity={1.5} />
          <directionalLight position={[-5, 2, -4]} intensity={0.6} />
          <Suspense fallback={null}>
            <Model open={open} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI * 0.18}
            maxPolarAngle={Math.PI * 0.52}
            autoRotate={!open}
            autoRotateSpeed={0.9}
          />
        </Canvas>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-mapo-black/60 mt-2">
        Drag to rotate · Tap to dissect
      </p>

      {macros && (
        <div className="flex border-[4px] border-mapo-black mt-3">
          {spec.legend.map((l, i) => (
            <div
              key={l.k}
              className={`flex-1 px-2.5 py-2 text-mapo-black ${
                i < spec.legend.length - 1 ? "border-r-[4px] border-mapo-black" : ""
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-[0.14em] flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 border-2 border-mapo-black" style={{ background: l.sw }} />
                {l.label}
              </span>
              <b className="block font-display text-xl mt-0.5">{Math.round(macros[l.k] ?? 0)} g</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One canvas, five dishes. Each <Canvas> is its own WebGL context and browsers
 * cap those, so a tab switcher beats rendering five at once — especially on a
 * phone.
 */
export function DissectionShowcase({ dishes = DISH_KEYS, macrosByDish = {}, className = "" }) {
  const [active, setActive] = useState(dishes[0]);

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-0 border-[4px] border-mapo-black bg-mapo-black mb-0">
        {dishes.map((d) => {
          const on = d === active;
          return (
            <button
              key={d}
              onClick={() => setActive(d)}
              aria-pressed={on}
              className={`flex-1 min-w-[110px] px-3 py-3 font-display text-sm sm:text-base border-r-[4px] border-mapo-black last:border-r-0 ${
                on ? "bg-mapo-yellow text-mapo-black" : "bg-mapo-black text-mapo-yellow/70"
              }`}
              data-testid={`dish-tab-${d}`}
            >
              {MODELS[d]?.name || d}
            </button>
          );
        })}
      </div>
      <FoodDissection
        key={active}
        dish={active}
        macros={macrosByDish[active] || null}
        height={420}
        className="border-t-0"
      />
    </div>
  );
}
