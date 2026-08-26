/**
 * Geometry for the fallback look.
 *
 * These are not attempting photorealism — a modelled burger that tries to be
 * a photograph and misses lands squarely in the uncanny valley the brief warns
 * about. They aim instead for a clean studio-object read: matte surfaces, warm
 * key light, honest silhouettes. Every piece is a separate mesh so the exploded
 * view is real separation rather than a sliced-up picture.
 *
 * Each builder returns geometry only. Position, explode travel, hover state and
 * hit testing all live one level up in FoodStack, so swapping a builder for a
 * textured plane changes nothing about how the layer behaves.
 */
import { useMemo } from "react";
import { DoubleSide } from "three";

function Surface({ color, rough = 0.72, metal = 0.02, ...rest }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} {...rest} />;
}

/** Deterministic scatter — same layout every render, no useMemo churn. */
function scatter(count, radius, seed = 1) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const t = (i + seed * 0.37) / count;
    const r = radius * Math.sqrt(t) * 0.92;
    const a = i * golden + seed;
    out.push([Math.cos(a) * r, 0, Math.sin(a) * r, a]);
  }
  return out;
}

function BunTop({ r, color }) {
  const seeds = useMemo(() => scatter(22, r * 0.78, 3), [r]);
  return (
    <group>
      <mesh position={[0, 0.20, 0]} scale={[1, 0.66, 1]}>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Surface color={color} rough={0.85} />
      </mesh>
      <mesh position={[0, 0.10, 0]}>
        <cylinderGeometry args={[r, r * 0.96, 0.22, 48]} />
        <Surface color={color} rough={0.85} />
      </mesh>
      {seeds.map(([x, , z], i) => (
        <mesh key={i} position={[x, 0.20 + 0.62 * r * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (r * r))), z]} scale={[1, 0.5, 1.7]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <Surface color="#F0E2C0" rough={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function BunBase({ r, color }) {
  return (
    <mesh>
      <cylinderGeometry args={[r, r * 0.9, 0.46, 48]} />
      <Surface color={color} rough={0.88} />
    </mesh>
  );
}

function Patty({ r, h, color }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[r, r * 0.97, h, 48]} />
        <Surface color={color} rough={0.94} />
      </mesh>
      {/* Grill marks: short parallel bands, only a shade darker than the
          meat. Long crossed lines read as scratches on the render. */}
      {[-0.5, 0, 0.5].map((z, i) => (
        <mesh key={i} position={[0, h / 2 + 0.004, z * r * 0.8]} rotation={[0, 0.32, 0]}>
          <boxGeometry args={[r * 1.05, 0.01, 0.075]} />
          <Surface color="#4A2C17" rough={1} />
        </mesh>
      ))}
    </group>
  );
}

function Slab({ r, color }) {
  // A cheese slice: square, rotated a few degrees off the bun's axis, with the
  // corners just starting to droop. Sized to sit inside the bun rather than
  // spear out past it — an oversized slab reads as a plank, not as cheese.
  return (
    <group rotation={[0, Math.PI * 0.12, 0]}>
      <mesh>
        <boxGeometry args={[r * 1.42, 0.055, r * 1.42]} />
        <Surface color={color} rough={0.5} />
      </mesh>
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[sx * r * 0.6, -0.05, sz * r * 0.6]}
          rotation={[sz * 0.26, 0, -sx * 0.26]}
        >
          <boxGeometry args={[r * 0.3, 0.05, r * 0.3]} />
          <Surface color={color} rough={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Spread({ r, h, color }) {
  return (
    <mesh>
      <cylinderGeometry args={[r, r * 0.94, h, 48]} />
      <Surface color={color} rough={0.42} />
    </mesh>
  );
}

function Slices({ r, color }) {
  const spots = useMemo(() => scatter(4, r * 1.9, 5), [r]);
  return (
    <group>
      {spots.map(([x, , z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <cylinderGeometry args={[r, r, 0.1, 32]} />
          <Surface color={color} rough={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Rings({ r, color }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * r * 0.5, i * 0.02, (i % 2 ? 0.28 : -0.28)]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 0.52 - i * 0.05, 0.045, 10, 40]} />
          <Surface color={color} rough={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Ruffle({ r, color }) {
  // Lettuce: a ring of tilted, crumpled discs. Reads as leaf from any angle.
  const leaves = useMemo(() => scatter(16, r * 0.78, 7), [r]);
  return (
    <group>
      {leaves.map(([x, , z, a], i) => (
        <mesh
          key={i}
          position={[x, (i % 3) * 0.035, z]}
          rotation={[Math.PI / 2 + Math.sin(a) * 0.3, a, Math.cos(a) * 0.28]}
          scale={[1, 1, 0.3]}
        >
          <sphereGeometry args={[r * 0.26, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.78} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Disc({ r, h, color }) {
  return (
    <mesh>
      <cylinderGeometry args={[r, r * 0.98, h, 64]} />
      <Surface color={color} rough={0.88} />
    </mesh>
  );
}

function Shred({ r, color }) {
  // Grated mozzarella: a lot of small tumbled boxes, thicker toward the middle.
  const bits = useMemo(() => scatter(120, r, 11), [r]);
  return (
    <group>
      {bits.map(([x, , z, a], i) => (
        <mesh key={i} position={[x, (i % 4) * 0.018, z]} rotation={[0, a, (i % 5) * 0.2]}>
          <boxGeometry args={[0.19, 0.05, 0.06]} />
          <Surface color={color} rough={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function ToppingPiece({ style, position, rotation }) {
  const { kind, size, color } = style;
  if (kind === "ring") {
    return (
      <mesh position={position} rotation={[Math.PI / 2, 0, rotation]}>
        <torusGeometry args={[size, size * 0.3, 8, 24]} />
        <Surface color={color} rough={0.5} />
      </mesh>
    );
  }
  if (kind === "dome") {
    return (
      <mesh position={position} rotation={[0, rotation, 0]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[size, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Surface color={color} rough={0.72} />
      </mesh>
    );
  }
  if (kind === "bead") {
    return (
      <mesh position={position}>
        <sphereGeometry args={[size, 10, 8]} />
        <Surface color={color} rough={0.45} />
      </mesh>
    );
  }
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[size, size * 0.65, size]} />
      <Surface color={color} rough={0.8} />
    </mesh>
  );
}

/**
 * Toppings are placed by an interleaved scatter, so adding a second kind
 * distributes it through the existing ones instead of dropping it in a clump
 * on one side.
 */
function Toppings({ r, items }) {
  const placed = useMemo(() => {
    const total = items.reduce((n, it) => n + it.style.count, 0);
    if (!total) return [];
    const points = scatter(total, r, 13);

    // Round-robin the kinds into the point list rather than laying each kind
    // down in a block. Dropped in blocks, adding olives puts every olive on
    // one side of the pizza; interleaved, they distribute across it.
    const queues = items.map((it) => ({ item: it, left: it.style.count, made: 0 }));
    const out = [];
    let cursor = 0;
    while (out.length < total && cursor < total * 2) {
      let placedThisPass = false;
      queues.forEach((q) => {
        if (q.left <= 0 || out.length >= total) return;
        const p = points[out.length];
        if (!p) return;
        out.push({
          key: `${q.item.key}-${q.made}`,
          style: q.item.style,
          position: [p[0], 0, p[2]],
          rotation: p[3],
        });
        q.left -= 1;
        q.made += 1;
        placedThisPass = true;
      });
      if (!placedThisPass) break;
      cursor += 1;
    }
    return out;
  }, [items, r]);

  return (
    <group>
      {placed.map((p) => (
        <ToppingPiece key={p.key} style={p.style} position={p.position} rotation={p.rotation} />
      ))}
    </group>
  );
}

/** Cheese after the bake: one poured sheet with a slightly uneven edge. */
function Melt({ r, color }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[r, r * 0.99, 0.1, 64]} />
        <Surface color={color} rough={0.45} />
      </mesh>
      {scatter(9, r * 0.7, 17).map(([x, , z], i) => (
        <mesh key={i} position={[x, 0.05, z]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.2 + (i % 3) * 0.05, 12, 8]} />
          <Surface color={color} rough={0.4} />
        </mesh>
      ))}
    </group>
  );
}

const BUILDERS = {
  bunTop: BunTop,
  bunBase: BunBase,
  patty: Patty,
  slab: Slab,
  spread: Spread,
  slices: Slices,
  rings: Rings,
  ruffle: Ruffle,
  disc: Disc,
  shred: Shred,
  melt: Melt,
  toppings: Toppings,
};

export default function LayerGeometry({ build, toppings }) {
  const Builder = BUILDERS[build.kind];
  if (!Builder) return null;
  if (build.kind === "toppings") return <Builder r={build.r} items={toppings || []} />;
  return <Builder {...build} />;
}
