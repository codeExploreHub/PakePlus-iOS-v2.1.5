
import React, { useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import HandTracker from './components/HandTracker';
import { useStore } from './store';

const App: React.FC = () => {
  const toggleUI = useStore((s) => s.toggleUI);
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const bgmPlaying = useStore((s) => s.bgmPlaying);
  const customBgmUrl = useStore((s) => s.customBgmUrl);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        toggleUI();
      }
    };
    
    const handleResize = () => {
      // If window becomes larger than mobile threshold, auto-expand UI
      if (window.innerWidth >= 640) {
        toggleCollapse(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [toggleUI, toggleCollapse]);

  // Audio Control Logic
  useEffect(() => {
    const audio = document.getElementById('bgm-audio') as HTMLAudioElement;
    if (audio) {
      if (customBgmUrl && audio.src !== customBgmUrl) {
        audio.src = customBgmUrl;
        audio.load();
      }
      
      if (bgmPlaying) {
        audio.play().catch((err) => {
          console.warn("Autoplay prevented. Interaction required.", err);
        });
      } else {
        audio.pause();
      }
    }
  }, [bgmPlaying, customBgmUrl]);

  return (
    <div className="w-screen h-screen bg-black relative">
      <Suspense fallback={null}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 50], fov: 45 }}
          gl={{ antialias: true, alpha: false, stencil: false, depth: true }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </Suspense>

      <UIOverlay />
      <HandTracker />

      {/* Background Music Source */}
      <audio 
        id="bgm-audio" 
        loop 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
      />
    </div>
  );
};

export default App;
