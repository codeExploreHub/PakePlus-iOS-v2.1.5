
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Vector3, 
  Color, 
} from 'three';
import { useStore } from '../store';
import { PARTICLE_COUNT, COLORS } from '../constants';
import { getTreePosition, getNebulaPosition } from '../utils';

const tempObject = new Object3D();
const tempPos = new Vector3();
const treePos = new Vector3();
const nebulaPos = new Vector3();
const repulsionVec = new Vector3();

const ORNAMENT_COLORS = [
  COLORS.RETRO_GOLD,
  COLORS.WINE_RED,
  COLORS.GRAY_BLUE,
  COLORS.ROSE_PINK,
  COLORS.CHAMPAGNE_GOLD,
  COLORS.ORANGE,
  COLORS.PALE_BLUE
];

const TreeParticles: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const ornamentMeshRef = useRef<InstancedMesh>(null);
  
  const { phase, handData, transitionFactor } = useStore();
  const { mouse, viewport } = useThree();

  const TREE_PARTICLE_COUNT = 2000;
  const ORNAMENT_COUNT = 500;

  const particleData = useMemo(() => {
    const rainbowColors = [COLORS.GOLD, COLORS.ROSE_PINK, COLORS.PALE_BLUE, COLORS.ORANGE];
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      scale: Math.random() * 0.4 + 0.3, 
      speed: Math.random() * 0.4 + 0.3,
      twinkleSpeed: Math.random() * 2 + 1,
      twinkleOffset: Math.random() * Math.PI * 2,
      rotationSpeed: new Vector3(
        Math.random() * 0.05,
        Math.random() * 0.05,
        Math.random() * 0.05
      ),
      color: Math.random() > 0.9 
        ? new Color(rainbowColors[Math.floor(Math.random() * rainbowColors.length)]) 
        : new Color(COLORS.DEEP_GREEN).offsetHSL(Math.random() * 0.05, 0, 0)
    }));
  }, []);

  const mouseWorldPos = useMemo(() => new Vector3(), []);

  const updateInstances = (
    mesh: InstancedMesh, 
    count: number, 
    offsetIndex: number, 
    time: number, 
    isOrnament = false
  ) => {
    mouseWorldPos.set(mouse.x * viewport.width / 2, mouse.y * viewport.height / 2, 0);
    if (handData.active) {
      mouseWorldPos.set((handData.position.x - 0.5) * 40, -(handData.position.y - 0.5) * 30, 0);
    }

    for (let i = 0; i < count; i++) {
      const idx = offsetIndex + i;
      const data = particleData[idx];
      if (!data) continue;
      
      // Calculate both positions
      treePos.copy(getTreePosition(idx, PARTICLE_COUNT, time * 0.1));
      if (isOrnament) {
        const spiralT = (i / count);
        const radius = 10.5 * spiralT;
        const angle = spiralT * 42 * Math.PI + time * 0.08 + (idx * 0.01);
        treePos.set(Math.cos(angle) * radius, (1 - spiralT) * 28 - 14, Math.sin(angle) * radius);
      }
      nebulaPos.copy(getNebulaPosition(idx, PARTICLE_COUNT, time * 0.1));

      // Synchronized interpolation based on transitionFactor
      tempPos.lerpVectors(treePos, nebulaPos, transitionFactor);

      // Repulsion logic (only active when near tree state)
      const dist = tempPos.distanceTo(mouseWorldPos);
      const repulsionRadius = 12 * (1 - transitionFactor);
      if (dist < repulsionRadius && transitionFactor < 0.2) {
        repulsionVec.copy(tempPos).sub(mouseWorldPos).normalize();
        const force = (1 - dist / repulsionRadius) * 6;
        tempPos.add(repulsionVec.multiplyScalar(force));
      }

      tempObject.position.copy(tempPos);
      
      const twinkle = 0.8 + Math.sin(time * data.twinkleSpeed + data.twinkleOffset) * 0.2;
      const scaleBase = isOrnament ? 0.95 : 0.65;
      tempObject.scale.setScalar(data.scale * scaleBase * twinkle);
      
      tempObject.rotation.x += data.rotationSpeed.x;
      tempObject.rotation.y += data.rotationSpeed.y;
      tempObject.rotation.z += data.rotationSpeed.z;
      
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) updateInstances(meshRef.current, TREE_PARTICLE_COUNT, 0, time);
    if (ornamentMeshRef.current) updateInstances(ornamentMeshRef.current, ORNAMENT_COUNT, TREE_PARTICLE_COUNT, time, true);
  });

  useEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < TREE_PARTICLE_COUNT; i++) {
        meshRef.current.setColorAt(i, particleData[i].color);
      }
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
    if (ornamentMeshRef.current) {
      for (let i = 0; i < ORNAMENT_COUNT; i++) {
        ornamentMeshRef.current.setColorAt(i, new Color(ORNAMENT_COLORS[i % ORNAMENT_COLORS.length]));
      }
      if (ornamentMeshRef.current.instanceColor) ornamentMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particleData]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null as any, null as any, TREE_PARTICLE_COUNT]}>
        <tetrahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial roughness={0.1} metalness={0.6} emissive={COLORS.DEEP_GREEN} emissiveIntensity={0.5} />
      </instancedMesh>
      <instancedMesh ref={ornamentMeshRef} args={[null as any, null as any, ORNAMENT_COUNT]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshPhysicalMaterial roughness={0.02} metalness={0.9} clearcoat={1.0} clearcoatRoughness={0.05} transmission={0.2} thickness={0.5} />
      </instancedMesh>
    </group>
  );
};

export default TreeParticles;
