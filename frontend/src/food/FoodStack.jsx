/**
 * FoodStack — one WebGL scene that renders a dish as independently
 * controllable layers, and reports where each layer ended up on screen so the
 * page can draw leader lines to it.
 *
 * Two things drive everything:
 *   explodeRef.current   0 = assembled, 1 = fully separated
 *   layers[].visible     whether a layer is in the dish at all
 *
 * Scroll writes to `explodeRef` rather than to React state. A scroll-linked
 * value that goes through setState re-renders the whole tree sixty times a
 * second and the animation stutters on a phone; a ref read inside useFrame
 * costs nothing. The same reason the projection map is throttled before it
 * reaches React.
 *
 * Layers render as textured planes when photoreal artwork is present and as
 * geometry when it is not — see manifest.js. Everything else about a layer,
 * including its hit target, is identical either way.
 */
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useTexture } from "@react-three/drei";
import { Vector3 } from "three";
import LayerGeometry from "./Geometry";
import { TOPPING_STYLE } from "./manifest";

const TMP = new Vector3();

/** Frame-rate independent approach: same feel at 30fps and 144fps. */
function approach(current, target, dt, smoothing = 0.0009) {
  return current + (target - current) * (1 - Math.pow(smoothing, dt));
}

function ImageLayer({ src, flat, width = 6 }) {
  const texture = useTexture(src);
  const aspect = (texture.image?.width || 1) / (texture.image?.height || 1);
  return (
    <mesh rotation={flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <planeGeometry args={[width, width / aspect]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

/**
 * One layer. Owns its own easing so layers settle at slightly different rates,
 * which is what stops an exploded stack from looking like a single rigid
 * object sliding apart.
 */
function Layer({ layer, index, visible, useImages, flat, explodeRef, focused, dimmed, toppings, onPointer }) {
  const group = useRef();
  const target = useRef({ y: layer.y, scale: 1, opacity: 1 });

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const t = Math.max(0, Math.min(1, explodeRef.current ?? 0));

    // Layers further from the middle of the stack lead the separation
    // slightly. Staggering by index is what gives it a peel rather than a pop.
    const stagger = 1 + index * 0.022;
    const y = layer.y + layer.explode * t * stagger;

    // A focused layer steps toward the viewer and lifts a touch.
    const focusLift = focused ? 0.16 : 0;
    const focusZ = focused ? 0.38 : 0;
    const scale = visible ? (focused ? 1.045 : 1) : 0.86;

    target.current.y = y + focusLift;
    g.position.y = approach(g.position.y, target.current.y, dt);
    g.position.z = approach(g.position.z, focusZ, dt);
    const s = approach(g.scale.x, scale, dt);
    g.scale.setScalar(s);

    // Removed layers fade rather than vanish, so the change is legible.
    const wantOpacity = visible ? (dimmed ? 0.34 : 1) : 0;
    g.traverse((child) => {
      if (!child.material) return;
      if (child.material.opacity === undefined) return;
      child.material.transparent = true;
      child.material.opacity = approach(child.material.opacity, wantOpacity, dt, 0.002);
    });
    g.visible = g.scale.x > 0.01 && wantOpacity > 0.01;
  });

  const handlers = useMemo(
    () => ({
      onPointerOver: (e) => {
        e.stopPropagation();
        onPointer("over", layer);
      },
      onPointerOut: (e) => {
        e.stopPropagation();
        onPointer("out", layer);
      },
      onClick: (e) => {
        e.stopPropagation();
        onPointer("click", layer);
      },
    }),
    [layer, onPointer]
  );

  return (
    <group ref={group} position={[0, layer.y, 0]} {...handlers} name={layer.id}>
      {useImages && layer.image ? (
        <Suspense fallback={null}>
          <ImageLayer src={layer.image} flat={flat} />
        </Suspense>
      ) : (
        <LayerGeometry build={layer.build} toppings={toppings} />
      )}
      {/* An invisible slab guarantees a generous, stable hit target even when
          the visible layer is a scatter of small pieces. Fingers are blunt. */}
      <mesh visible={false} position={[0, 0, 0]}>
        <cylinderGeometry args={[(layer.build?.r || 2) * 1.05, (layer.build?.r || 2) * 1.05, 0.34, 16]} />
      </mesh>
    </group>
  );
}

/**
 * Publishes where each layer sits on screen, ~15 times a second.
 *
 * Leader lines have to be drawn in the DOM — SVG strokes and real text stay
 * crisp and stay accessible, which text baked into WebGL does not. That means
 * the page needs screen coordinates for something that lives in the scene.
 */
function Projector({ layers, visibleIds, onProject }) {
  const { camera, size } = useThree();
  const last = useRef(0);

  useFrame((state) => {
    if (!onProject) return;
    if (state.clock.elapsedTime - last.current < 0.066) return;
    last.current = state.clock.elapsedTime;

    const out = {};
    layers.forEach((layer) => {
      if (!visibleIds.has(layer.id)) return;
      const obj = state.scene.getObjectByName(layer.id);
      if (!obj || !obj.visible) return;
      obj.getWorldPosition(TMP);
      TMP.project(camera);
      out[layer.id] = {
        x: (TMP.x * 0.5 + 0.5) * size.width,
        y: (-TMP.y * 0.5 + 0.5) * size.height,
      };
    });
    onProject(out);
  });

  return null;
}

/** Warm studio key, cool fill, low rim. No environment map, no bloom. */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4.5, 7.5, 5]} intensity={2.1} color="#FFF0D8" />
      <directionalLight position={[-5, 2.5, -3.5]} intensity={0.65} color="#9FB4C8" />
      <directionalLight position={[0, 3, -6]} intensity={0.5} color="#FFD9A0" />
    </>
  );
}

export default function FoodStack({
  layers,
  camera = [0, 1.4, 9.2],
  fov = 34,
  flat = false,
  useImages = false,
  explodeRef,
  focusId = null,
  onFocus,
  toppings,
  onProject,
  className = "",
  showShadow = true,
}) {
  const [hovered, setHovered] = useState(null);
  const fallbackRef = useRef(0);
  const progress = explodeRef || fallbackRef;

  const visibleIds = useMemo(
    () => new Set(layers.filter((l) => l.visible !== false).map((l) => l.id)),
    [layers]
  );

  const handlePointer = useCallback(
    (kind, layer) => {
      if (kind === "over") {
        setHovered(layer.id);
        document.body.style.cursor = "pointer";
      } else if (kind === "out") {
        setHovered((h) => (h === layer.id ? null : h));
        document.body.style.cursor = "";
      } else if (kind === "click") {
        onFocus?.(focusId === layer.id ? null : layer.id);
      }
    },
    [focusId, onFocus]
  );

  const toppingItems = useMemo(
    () =>
      (toppings || [])
        .filter((t) => t.count > 0 && TOPPING_STYLE[t.key])
        .map((t) => ({
          key: t.key,
          style: { ...TOPPING_STYLE[t.key], count: TOPPING_STYLE[t.key].count * Math.min(t.count, 2) },
        })),
    [toppings]
  );

  const active = focusId || hovered;

  return (
    <div className={className}>
      <Canvas
        camera={{ position: camera, fov }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", touchAction: "pan-y" }}
        onPointerMissed={() => onFocus?.(null)}
      >
        <Lighting />
        <Suspense fallback={null}>
          {layers.map((layer, i) => (
            <Layer
              key={layer.id}
              layer={layer}
              index={i}
              visible={layer.visible !== false}
              useImages={useImages}
              flat={flat}
              explodeRef={progress}
              focused={active === layer.id}
              dimmed={Boolean(active) && active !== layer.id}
              toppings={toppingItems}
              onPointer={handlePointer}
            />
          ))}
          {showShadow && (
            <ContactShadows
              position={[0, -2.35, 0]}
              opacity={0.5}
              scale={13}
              blur={2.6}
              far={5}
              resolution={512}
              color="#000000"
            />
          )}
        </Suspense>
        <Projector layers={layers} visibleIds={visibleIds} onProject={onProject} />
      </Canvas>
    </div>
  );
}
