import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

const MACROS = [
  { key: "protein", label: "Protein", color: "#7A3E12", target: [-2.4, 1.1, 0.2] },
  { key: "carbs", label: "Carbs", color: "#FFF3D0", target: [2.4, 1.1, -0.2] },
  { key: "fat", label: "Fat", color: "#D2600A", target: [0, -2.3, 0.2] },
];

function MacroSphere({ target, color, label, value, exploded }) {
  const ref = useRef();
  const tmp = new THREE.Vector3();
  useFrame(() => {
    if (!ref.current) return;
    tmp.set(...(exploded ? target : [0, 0, 0]));
    ref.current.position.lerp(tmp, 0.08);
    const s = exploded ? 1 : 0.3;
    ref.current.scale.lerp(tmp.set(s, s, s), 0.1);
  });
  return (
    <Float speed={2.2} rotationIntensity={0.5} floatIntensity={1.1}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshToonMaterial color={color} />
        {exploded && (
          <Html center distanceFactor={7} position={[0, 1.05, 0]} zIndexRange={[20, 0]}>
            <div className="bg-mapo-yellow border-[3px] border-mapo-black px-3 py-1.5 whitespace-nowrap pointer-events-none">
              <p className="font-display text-[11px] uppercase tracking-widest" style={{ color: "#0B0B0B" }}>
                {label}
              </p>
              <p className="font-display text-sm text-mapo-black">{value}g</p>
            </div>
          </Html>
        )}
      </mesh>
    </Float>
  );
}

function Dish({ exploded, onToggle }) {
  const ref = useRef();
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.35;
  });
  return (
    <Float speed={1.6} floatIntensity={0.9}>
      <mesh ref={ref} onClick={onToggle} scale={exploded ? 0.75 : 1.3}>
        <icosahedronGeometry args={[1, 1]} />
        <meshToonMaterial color="#FFD400" flatShading wireframe={exploded} />
      </mesh>
    </Float>
  );
}

export default function MacroScene({ macros, height = "60vh", compact = false }) {
  const [exploded, setExploded] = useState(false);
  const m = macros || { protein: 45, carbs: 60, fat: 20 };

  return (
    <div className="relative w-full" style={{ height }} data-testid="macro-scene">
      <Canvas camera={{ position: [0, 0, 6.2], fov: 50 }} dpr={[1, 2]} style={{ background: "#0B0B0B" }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 6, 5]} intensity={2.8} />
        <directionalLight position={[-5, 2, -4]} intensity={0.7} />
        <Dish exploded={exploded} onToggle={() => setExploded((e) => !e)} />
        {MACROS.map((x) => (
          <MacroSphere key={x.key} target={x.target} color={x.color} label={x.label} value={m[x.key]} exploded={exploded} />
        ))}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
      </Canvas>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          data-testid="macro-toggle-btn"
          onClick={() => setExploded((e) => !e)}
          className="bg-mapo-yellow text-mapo-black border-[3px] border-mapo-black px-5 py-2.5 text-sm font-display flex items-center gap-2"
        >
          <span className="h-2 w-2 bg-mapo-black" />
          {exploded ? "Reassemble meal" : "Break down macros"}
        </button>
      </div>
      {!compact && (
        <p className="absolute top-4 left-4 z-10 text-xs text-white/40 max-w-[160px] leading-relaxed">
          Drag to rotate · tap the core to split into Protein · Carbs · Fats
        </p>
      )}
    </div>
  );
}
