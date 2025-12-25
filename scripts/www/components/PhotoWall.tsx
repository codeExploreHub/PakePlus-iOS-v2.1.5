
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, Vector3, Group, SRGBColorSpace, Euler } from 'three';
import { useStore } from '../store';
import { PhotoData } from '../types';
import { getRandomPos } from '../utils';

const PhotoFrame: React.FC<{ photo: PhotoData; index: number; total: number }> = ({ photo, index, total }) => {
  const { url, id, aspectRatio } = photo;
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  
  const texture = useLoader(TextureLoader, url);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = SRGBColorSpace;
    }
  }, [texture]);
  
  const { phase, focusedPhotoId, transitionFactor } = useStore();
  const isFocused = focusedPhotoId === id;
  
  // Base dimensions calculation
  const baseSize = 1.0;
  const photoW = aspectRatio > 1 ? baseSize : baseSize * aspectRatio;
  const photoH = aspectRatio > 1 ? baseSize / aspectRatio : baseSize;

  const frameW = photoW + 0.16;
  const frameH = photoH + 0.33;
  const photoYOffset = 0.08;

  // Pre-calculate random scatter parameters
  const scatterData = useMemo(() => ({
    pos: getRandomPos(index, 55), // Random position in a 55-unit spread
    rot: new Euler(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * Math.PI,
      (Math.random() - 0.5) * 0.2
    )
  }), [index]);

  const targetPos = useMemo(() => new Vector3(), []);
  const currentPos = useRef(new Vector3(0, -50, 0));
  const targetScale = useMemo(() => new Vector3(0, 0, 0), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    if (phase === 'focus') {
      if (isFocused) {
        targetPos.set(0, 2, 34); 
        targetScale.set(8.0, 8.0, 8.0); 
        groupRef.current.renderOrder = 1000; 
        groupRef.current.quaternion.copy(camera.quaternion);
      } else {
        targetPos.set(0, -60, 0);
        targetScale.set(0, 0, 0);
        groupRef.current.renderOrder = 0;
      }
    } else if (phase === 'tree' || (phase === 'collapsing' && transitionFactor < 0.1)) {
      targetPos.set(0, -20, 0);
      targetScale.set(0, 0, 0);
      groupRef.current.renderOrder = 0;
    } else {
      // Nebula / Scattered mode
      // Use the pre-calculated random position with some floating motion
      targetPos.copy(scatterData.pos);
      targetPos.y += Math.sin(time * 0.5 + index) * 2;
      targetPos.x += Math.cos(time * 0.3 + index) * 1.5;
      
      // Photos face the center or maintain a slight random tilt
      groupRef.current.lookAt(0, 2, 0);
      // Add a bit of the random tilt to make it look "floating"
      groupRef.current.rotation.z += scatterData.rot.z + Math.sin(time * 0.2 + index) * 0.1;

      targetScale.set(3.5, 3.5, 3.5);
      groupRef.current.renderOrder = 0;
    }

    currentPos.current.lerp(targetPos, 0.1);
    groupRef.current.position.copy(currentPos.current);
    groupRef.current.scale.lerp(targetScale, 0.12);
  });

  return (
    <group ref={groupRef}>
      {/* Polaroid White Background */}
      <mesh position={[0, -photoYOffset / 2, -0.01]}>
        <planeGeometry args={[frameW, frameH]} />
        <meshStandardMaterial 
          color="#fefefe" 
          roughness={0.8} 
          metalness={0.1}
          emissive={isFocused ? "#ffffff" : "#222222"}
          emissiveIntensity={isFocused ? 0.3 : 0.05}
        />
      </mesh>

      {/* Actual Photo */}
      <mesh position={[0, photoYOffset, 0]}>
        <planeGeometry args={[photoW, photoH]} />
        <meshBasicMaterial map={texture} transparent={true} toneMapped={false} />
      </mesh>

      {/* Subtle Depth / Shadow */}
      <mesh position={[0, -photoYOffset / 2, -0.015]}>
        <boxGeometry args={[frameW, frameH, 0.01]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const PhotoWall: React.FC = () => {
  const photos = useStore((s) => s.photos);
  
  return (
    <group>
      {photos.map((photo, i) => (
        <PhotoFrame 
          key={photo.id} 
          photo={photo}
          index={i} 
          total={photos.length} 
        />
      ))}
    </group>
  );
};

export default PhotoWall;
