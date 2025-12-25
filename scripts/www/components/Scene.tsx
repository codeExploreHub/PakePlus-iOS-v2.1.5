
import React, { Suspense, useEffect, useRef } from 'react';
import { Stars, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette, Noise, BrightnessContrast } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import TreeParticles from './TreeParticles';
import ExtraOrnaments from './ExtraOrnaments';
import PhotoWall from './PhotoWall';
import TopStar from './TopStar';
import RibbonParticles from './RibbonParticles';
import SpiralingGlowRibbon from './SpiralingGlowRibbon';
import Dust from './Dust';
import { COLORS } from '../constants';
import { useStore } from '../store';

const Scene: React.FC = () => {
  const { handData, phase, rotationVelocity, accumulatedRotation, updateRotation, applyFriction, resetRotation } = useStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (phase === 'focus') {
      resetRotation(false);
      gsap.to(camera.position, {
        x: 0,
        y: 2,
        z: 50,
        duration: 1.0,
        ease: "power3.inOut"
      });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 2,
          z: 0,
          duration: 1.0,
          ease: "power3.inOut"
        });
      }
    }
  }, [phase, camera, resetRotation]);

  useFrame(() => {
    updateRotation(rotationVelocity.x, rotationVelocity.y);
    applyFriction(0.94);
    if (phase === 'focus') {
      camera.lookAt(0, 2, 0);
    }
  });

  const currentHandRotX = phase === 'focus' ? 0 : handData.rotation.x * 0.1;
  const currentHandRotY = phase === 'focus' ? 0 : handData.rotation.y * 0.1;

  return (
    <>
      <color attach="background" args={['#000000']} />
      
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 10, 0]} intensity={4} color={COLORS.ORANGE} />
      
      <spotLight 
        position={[30, 50, 40]} 
        intensity={2000} 
        angle={0.4} 
        penumbra={1} 
        color={COLORS.GOLD} 
        castShadow 
      />
      
      <spotLight 
        position={[-30, 20, -30]} 
        intensity={1000} 
        angle={0.5} 
        penumbra={1} 
        color={COLORS.PALE_BLUE} 
      />

      <Environment preset="night" />

      <Suspense fallback={null}>
        <group 
          rotation={[
            accumulatedRotation.x + currentHandRotX, 
            accumulatedRotation.y + currentHandRotY, 
            0
          ]}
        >
          <TreeParticles />
          <ExtraOrnaments />
          <RibbonParticles />
          <SpiralingGlowRibbon />
          <TopStar />
          <PhotoWall />
          <Dust />
          <Stars radius={150} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
        </group>
      </Suspense>

      <ContactShadows opacity={0.3} scale={60} blur={2} far={15} resolution={256} color="#000000" />

      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        enableRotate={phase !== 'focus'} 
        enableZoom={phase !== 'focus'} 
        maxDistance={80} 
        minDistance={10}
        makeDefault
      />

      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={2.0} 
          radius={0.7} 
        />
        <BrightnessContrast brightness={0.05} contrast={0.15} />
        <Vignette eskil={false} offset={0.1} darkness={1.3} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </>
  );
};

export default Scene;
