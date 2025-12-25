
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { COLORS, TREE_HEIGHT } from '../constants';
import { useStore } from '../store';

const TopStar: React.FC = () => {
  const meshRef = useRef<Mesh>(null);
  const { phase } = useStore();
  
  // 使用 useMemo 确保目标位置和当前位置对象在渲染间持久化
  const targetPos = useMemo(() => new Vector3(0, TREE_HEIGHT - 14 + 1.5, 0), []);
  const hiddenPos = useMemo(() => new Vector3(0, 0, 0), []);
  const currentPos = useRef(new Vector3(0, -20, 0)); // 初始在下方，等待平滑升起
  const targetScale = useMemo(() => new Vector3(2.5, 2.5, 2.5), []);
  const zeroScale = useMemo(() => new Vector3(0, 0, 0), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    if (phase === 'tree' || phase === 'collapsing') {
      // 平滑移动到树顶 (Y = 15.5)
      currentPos.current.lerp(targetPos, 0.08);
      meshRef.current.scale.lerp(targetScale, 0.1);
    } else {
      // 在星云模式下收缩并移动到中心点
      currentPos.current.lerp(hiddenPos, 0.05);
      meshRef.current.scale.lerp(zeroScale, 0.1);
    }

    meshRef.current.position.copy(currentPos.current);
    
    // 旋转动画
    meshRef.current.rotation.y = time * 2.5;
    meshRef.current.rotation.z = Math.sin(time) * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={COLORS.GOLD} 
        emissive={COLORS.GOLD} 
        emissiveIntensity={15} 
      />
      <pointLight intensity={40} distance={25} color={COLORS.GOLD} />
    </mesh>
  );
};

export default TopStar;
