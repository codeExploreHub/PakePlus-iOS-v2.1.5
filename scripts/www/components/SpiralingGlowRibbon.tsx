
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useStore } from '../store';
import { COLORS, TREE_HEIGHT, MAX_RADIUS } from '../constants';
import { getRandomPos } from '../utils';

const RIBBON_PARTICLE_COUNT = 1500;
const SPIRAL_LOOPS = 12; // Number of times it wraps around the tree

const tempObject = new Object3D();
const tempPos = new Vector3();
const treePos = new Vector3();
const nebulaPos = new Vector3();

const SpiralingGlowRibbon: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const { transitionFactor } = useStore();

  const particleData = useMemo(() => {
    return Array.from({ length: RIBBON_PARTICLE_COUNT }).map((_, i) => ({
      size: Math.random() * 0.3 + 0.2,
      speed: Math.random() * 0.2 + 0.1,
      pulseOffset: Math.random() * Math.PI * 2,
      // Pre-calculate random scatter position for the nebula phase
      scatterPos: getRandomPos(i, 60), 
      rotationAxis: new Vector3(Math.random(), Math.random(), Math.random()).normalize()
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < RIBBON_PARTICLE_COUNT; i++) {
      const data = particleData[i];
      // t flows from 0 (bottom) to 1 (top)
      const t = i / RIBBON_PARTICLE_COUNT;
      
      // TREE POSITION: Parametric Tight Spiral
      const height = t * TREE_HEIGHT - 14;
      const radius = (1 - t) * (MAX_RADIUS + 0.5); 
      const angle = t * Math.PI * 2 * SPIRAL_LOOPS + time * 0.5;
      
      treePos.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );

      // NEBULA POSITION: Randomized distribution
      // We add a bit of time-based drift to the random scatter positions
      nebulaPos.copy(data.scatterPos);
      nebulaPos.x += Math.sin(time * 0.2 + i) * 2;
      nebulaPos.y += Math.cos(time * 0.3 + i) * 2;
      nebulaPos.z += Math.sin(time * 0.15 + i * 0.5) * 2;

      // Transition interpolation based on global transitionFactor (0 to 1)
      tempPos.lerpVectors(treePos, nebulaPos, transitionFactor);
      
      tempObject.position.copy(tempPos);
      
      // Shimmering pulse effect
      const pulse = 0.8 + Math.sin(time * 4 + data.pulseOffset) * 0.2;
      // Shrink slightly when scattered to feel more like "stardust"
      const scaleFactor = 1.0 - (transitionFactor * 0.3);
      tempObject.scale.setScalar(data.size * pulse * scaleFactor);
      
      // Rotation logic
      if (transitionFactor < 0.1) {
        // Oriented with the spiral flow when in tree form
        tempObject.rotation.y = angle;
        tempObject.rotation.x = time * data.speed;
      } else {
        // Tumbling randomly when scattered
        tempObject.rotateOnAxis(data.rotationAxis, 0.02);
      }
      
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, RIBBON_PARTICLE_COUNT]}>
      <tetrahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial 
        color={COLORS.CHAMPAGNE_GOLD} 
        emissive={COLORS.GOLD} 
        emissiveIntensity={10} 
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
};

export default SpiralingGlowRibbon;
