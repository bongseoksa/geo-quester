'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';

interface SlothModelProps {
  showSloth?: boolean;
  showAnimation?: boolean;
}

function SlothModel({ showSloth = false, showAnimation = false }: SlothModelProps) {
  const slothRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (slothRef.current && showSloth && showAnimation) {
      slothRef.current.position.x = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      slothRef.current.position.y = 1.5 + Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.1;
      slothRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.1;
    }
  });

  if (!showSloth) return null;

  return (
    <group ref={slothRef} position={[0, 1.5, 0]} scale={[0.6, 0.6, 0.6]}>
      {/* 몸통 - 구를 늘려서 타원형으로 */}
      <mesh position={[0, 0, 0]} scale={[1, 1.5, 0.8]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* 머리 */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* 눈 */}
      <mesh position={[-0.15, 0.8, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.15, 0.8, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 코 */}
      <mesh position={[0, 0.65, 0.3]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      {/* 팔 */}
      <mesh position={[-0.5, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.5, 0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* 다리 */}
      <mesh position={[-0.2, -0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.2, -0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* 귀 */}
      <mesh position={[-0.25, 0.9, 0.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>
      <mesh position={[0.25, 0.9, 0.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>
    </group>
  );
}

function Globe({ showAnimation = false }: { showAnimation?: boolean }) {
  const globeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (globeRef.current && showAnimation) {
      globeRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#3399CC" roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

interface Globe3DProps {
  showSloth?: boolean;
  showAnimation?: boolean;
  className?: string;
}

export function Globe3D({
  showSloth = false,
  showAnimation = false,
  className = '',
}: Globe3DProps) {
  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />

        <Globe showAnimation={showAnimation} />
        <SlothModel showSloth={showSloth} showAnimation={showAnimation} />

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
