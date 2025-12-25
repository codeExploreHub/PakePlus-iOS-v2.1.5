
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Vector3, 
  Color, 
} from 'three';
import { useStore } from '../store';
import { COLORS, TREE_HEIGHT, MAX_RADIUS } from '../constants';

const RIBBON_PARTICLE_COUNT = 1200;
const RIBBON_COUNT = 4;
const tempObject = new Object3D();
const tempPos = new Vector3();
const tempTarget = new Vector3();

const RibbonParticles: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const { phase } = useStore();

  const particleData = useMemo(() => {
    const colors = [COLORS.GOLD, COLORS.CHAMPAGNE, COLORS.PALE_BLUE, COLORS.ROSE_PINK, COLORS.ORANGE, COLORS.CANDY_RED];
    return Array.from({ length: RIBBON_PARTICLE_COUNT }).map((_, i) => {
      const ribbonIdx = i % RIBBON_COUNT;
      return {
        ribbonIdx,
        color: new Color(colors[i % colors.length]),
        scale: Math.random() * 0.4 + 0.2,
        speed: Math.random() * 0.15 + 0.08,
        pulseOffset: Math.random() * Math.PI * 2,
        rotationOffset: new Vector3(Math.random(), Math.random(), Math.random())
      };
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < RIBBON_PARTICLE_COUNT; i++) {
      const data = particleData[i];
      const flowT = (i / RIBBON_PARTICLE_COUNT + time * data.speed) % 1;
      
      if (phase === 'tree' || phase === 'collapsing') {
        const height = flowT * TREE_HEIGHT - 14;
        const radius = (1 - flowT) * (MAX_RADIUS + 2.0);
        const angle = flowT * Math.PI * 12 + (data.ribbonIdx * (Math.PI * 2 / RIBBON_COUNT));
        
        tempTarget.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
      } else {
        const angle = (i / RIBBON_PARTICLE_COUNT) * Math.PI * 2 + time * 0.15;
        const radius = 24 + Math.sin(time * 0.5 + i) * 6;
        tempTarget.set(
          Math.cos(angle) * radius,
          Math.sin(angle + i) * 12,
          Math.sin(angle) * radius
        );
      }

      meshRef.current.getMatrixAt(i, tempObject.matrix);
      tempPos.setFromMatrixPosition(tempObject.matrix);
      tempPos.lerp(tempTarget, 0.08);

      tempObject.position.copy(tempPos);
      
      const pulse = 0.9 + Math.sin(time * 3 + data.pulseOffset) * 0.15;
      const baseScale = phase === 'tree' || phase === 'collapsing' ? data.scale * (1.2 - flowT) : data.scale;
      tempObject.scale.setScalar(baseScale * pulse);
      
      tempObject.rotation.set(
        time + data.rotationOffset.x, 
        time * 1.5 + data.rotationOffset.y, 
        0
      );
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  React.useEffect(() => {
    if (meshRef.current) {
      particleData.forEach((data, i) => {
        meshRef.current!.setColorAt(i, data.color);
      });
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [particleData]);

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, RIBBON_PARTICLE_COUNT]}>
      <tetrahedronGeometry args={[0.5, 0]} />
      {/* Use MeshBasicMaterial for guaranteed colorful glow without complex shader overrides */}
      <meshBasicMaterial 
        transparent 
        opacity={1.0}
        vertexColors
      />
    </instancedMesh>
  );
};

export default RibbonParticles;
