
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, Color } from 'three';
import { DUST_COUNT } from '../constants';

const Dust: React.FC = () => {
  const pointsRef = useRef<Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = [];
    const col = [];
    const colorObj = new Color();
    for (let i = 0; i < DUST_COUNT; i++) {
      pos.push((Math.random() - 0.5) * 150);
      pos.push((Math.random() - 0.5) * 150);
      pos.push((Math.random() - 0.5) * 150);
      
      // Generate vibrant random colors
      colorObj.setHSL(Math.random(), 0.8, 0.6);
      col.push(colorObj.r, colorObj.g, colorObj.b);
    }
    return [new Float32Array(pos), new Float32Array(col)];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.01;
      pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={2} // Additive blending for glow
      />
    </points>
  );
};

export default Dust;
