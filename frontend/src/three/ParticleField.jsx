import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function ParticleGroup() {
  const ref = useRef();
  useFrame(({ pointer }) => {
    if (!ref.current) return;
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, pointer.y * 0.25, 0.04);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * 0.25, 0.04);
  });
  return (
    <group ref={ref}>
      <Sparkles count={70} scale={13} size={2.2} speed={0.22} color="#FFD400" opacity={0.35} />
    </group>
  );
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" data-testid="particle-field">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]}>
        <ParticleGroup />
      </Canvas>
    </div>
  );
}
