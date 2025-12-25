
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  InstancedMesh, 
  Object3D, 
  Vector3, 
  Color, 
  CatmullRomCurve3, 
  TubeGeometry,
  CanvasTexture,
  RepeatWrapping,
  Euler
} from 'three';
import { useStore } from '../store';
import { EXTRA_ORNAMENT_COUNT, COLORS, TREE_HEIGHT, MAX_RADIUS } from '../constants';
import { getRandomPos } from '../utils';

const tempObject = new Object3D();
const treePos = new Vector3();
const nebulaPos = new Vector3();
const tempPos = new Vector3();

const ExtraOrnaments: React.FC = () => {
  const boxMeshRef = useRef<InstancedMesh>(null);
  const sphereMeshRef = useRef<InstancedMesh>(null);
  const caneMeshRef = useRef<InstancedMesh>(null);
  
  const { phase, transitionFactor } = useStore();

  const candyCaneTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; 
    ctx.lineWidth = 20;
    for (let i = -128; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(6, 1);
    return tex;
  }, []);

  const caneGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0, 1.2, 0),
      new Vector3(0.4, 1.5, 0),
      new Vector3(0.7, 1.2, 0),
    ]);
    return new TubeGeometry(curve, 24, 0.1, 8, false);
  }, []);

  const SUB_COUNT = EXTRA_ORNAMENT_COUNT / 3;

  const particleData = useMemo(() => {
    const vibrantColors = [COLORS.GOLD, COLORS.CANDY_RED, COLORS.ROSE_PINK, COLORS.ORANGE, COLORS.PALE_BLUE, COLORS.CHAMPAGNE, '#00ffcc', '#ff00ff', '#ffff00', '#0099ff'];
    return Array.from({ length: EXTRA_ORNAMENT_COUNT }).map((_, i) => ({
      scale: Math.random() * 0.4 + 0.6,
      initialRotation: new Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
      rotSpeed: new Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
      color: i < SUB_COUNT ? (i % 2 === 0 ? new Color(COLORS.GOLD) : new Color(COLORS.DEEP_GREEN)) : i < SUB_COUNT * 2 ? (i % 2 === 0 ? new Color(COLORS.GOLD) : new Color(COLORS.CANDY_RED)) : new Color(vibrantColors[i % vibrantColors.length]).clone()
    }));
  }, []);

  const updateInstances = (mesh: InstancedMesh, subIndexStart: number, count: number, time: number) => {
    for (let i = 0; i < count; i++) {
      const idx = subIndexStart + i;
      const data = particleData[idx];

      // Tree state
      const t = i / count;
      const height = (1 - t) * TREE_HEIGHT - 14;
      const radius = t * MAX_RADIUS;
      const angle = t * 45 * Math.PI + (idx * 0.05) + time * 0.1;
      treePos.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);

      // Nebula state
      nebulaPos.copy(getRandomPos(idx, 65));
      nebulaPos.y += Math.sin(time * 0.3 + idx) * 8;

      // Smooth interpolation
      tempPos.lerpVectors(treePos, nebulaPos, transitionFactor);
      
      tempObject.position.copy(tempPos);
      tempObject.scale.setScalar(data.scale * (1.0 - transitionFactor * 0.2));
      tempObject.rotation.set(
        data.initialRotation.x + time * data.rotSpeed.x,
        data.initialRotation.y + time * data.rotSpeed.y,
        data.initialRotation.z + time * data.rotSpeed.z
      );
      
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (boxMeshRef.current) updateInstances(boxMeshRef.current, 0, SUB_COUNT, time);
    if (sphereMeshRef.current) updateInstances(sphereMeshRef.current, SUB_COUNT, SUB_COUNT, time);
    if (caneMeshRef.current) updateInstances(caneMeshRef.current, SUB_COUNT * 2, SUB_COUNT, time);
  });

  useEffect(() => {
    if (boxMeshRef.current) {
      for (let i = 0; i < SUB_COUNT; i++) boxMeshRef.current.setColorAt(i, particleData[i].color);
      if (boxMeshRef.current.instanceColor) boxMeshRef.current.instanceColor.needsUpdate = true;
    }
    if (sphereMeshRef.current) {
      for (let i = 0; i < SUB_COUNT; i++) sphereMeshRef.current.setColorAt(i, particleData[SUB_COUNT + i].color);
      if (sphereMeshRef.current.instanceColor) sphereMeshRef.current.instanceColor.needsUpdate = true;
    }
    if (caneMeshRef.current) {
      for (let i = 0; i < SUB_COUNT; i++) caneMeshRef.current.setColorAt(i, particleData[SUB_COUNT * 2 + i].color);
      if (caneMeshRef.current.instanceColor) caneMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particleData, SUB_COUNT]);

  return (
    <group>
      <instancedMesh ref={boxMeshRef} args={[null as any, null as any, SUB_COUNT]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </instancedMesh>
      <instancedMesh ref={sphereMeshRef} args={[null as any, null as any, SUB_COUNT]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshPhysicalMaterial roughness={0.05} metalness={0.7} clearcoat={1.0} clearcoatRoughness={0.1} />
      </instancedMesh>
      <instancedMesh ref={caneMeshRef} args={[caneGeometry, null as any, SUB_COUNT]}>
        <meshStandardMaterial map={candyCaneTexture} roughness={0.3} metalness={0.4} />
      </instancedMesh>
    </group>
  );
};

export default ExtraOrnaments;
