
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { recognizeGesture } from '../utils';
import gsap from 'gsap';

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraOpenRef = useRef(false);
  
  // Resizing state
  const [dimensions, setDimensions] = useState({ width: window.innerWidth < 640 ? 112 : 160, height: window.innerWidth < 640 ? 96 : 128 });
  const isResizingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const { setHandData, uiVisible, addRotationVelocity } = useStore();
  const detectorRef = useRef<any>(null);
  const lastGestureRef = useRef<string>('None');
  
  const pinchFramesRef = useRef<number>(0);
  const noneFramesRef = useRef<number>(0);
  const isPinchingRef = useRef<boolean>(false);
  const prevHandPos = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const loadScript = (src: string) => new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      document.head.appendChild(script);
    });

    const initMediaPipe = async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");

      // @ts-ignore
      if (typeof window.Hands !== 'undefined') {
        // @ts-ignore
        const hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        hands.onResults((results: any) => {
          const state = useStore.getState();
          const { phase, photos, setPhase, setFocusedPhoto, setTransitionFactor } = state;

          if (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            setHandData({ active: false, gesture: 'None' });
            noneFramesRef.current++;
            if (noneFramesRef.current > 15 && phase === 'focus') {
              setFocusedPhoto(null);
              setPhase(state.transitionFactor > 0.5 ? 'nebula' : 'tree');
              isPinchingRef.current = false;
            }
            lastGestureRef.current = 'None';
            prevHandPos.current = null;
            return;
          }

          noneFramesRef.current = 0;
          const landmarks = results.multiHandLandmarks[0];
          const gesture = recognizeGesture(landmarks) as string;
          const center = landmarks[9]; 
          
          if (prevHandPos.current && phase !== 'focus') {
            const dx = center.x - prevHandPos.current.x;
            const dy = center.y - prevHandPos.current.y;
            addRotationVelocity(dy * 0.8, dx * 1.6); 
          }
          prevHandPos.current = { x: center.x, y: center.y };

          setHandData({
            active: true,
            gesture,
            rotation: { x: (center.y - 0.5) * Math.PI, y: (center.x - 0.5) * Math.PI },
            position: { x: center.x, y: center.y }
          });

          if (gesture === 'Open Palm' && phase === 'tree') {
            setPhase('blooming');
            gsap.to({ val: 0 }, {
              val: 1, duration: 1.5, ease: "expo.out",
              onUpdate: function() { setTransitionFactor(this.targets()[0].val); },
              onComplete: () => setPhase('nebula')
            });
          } else if (gesture === 'Closed Fist' && (phase === 'nebula' || phase === 'focus')) {
            setPhase('collapsing');
            setFocusedPhoto(null);
            isPinchingRef.current = false;
            gsap.to({ val: 1 }, {
              val: 0, duration: 1.5, ease: "power3.inOut",
              onUpdate: function() { setTransitionFactor(this.targets()[0].val); },
              onComplete: () => setPhase('tree')
            });
          }

          if (gesture === 'Pinch') {
            pinchFramesRef.current++;
            if (pinchFramesRef.current > 2 && !isPinchingRef.current) {
              if (photos.length > 0) {
                const randomIndex = Math.floor(Math.random() * photos.length);
                setFocusedPhoto(photos[randomIndex].id);
                setPhase('focus');
                isPinchingRef.current = true;
              }
            }
          } else {
            if (isPinchingRef.current && gesture !== 'Pinch') {
              pinchFramesRef.current = 0;
              setFocusedPhoto(null);
              setPhase(state.transitionFactor > 0.5 ? 'nebula' : 'tree');
              isPinchingRef.current = false;
            }
          }

          if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const drawUtils = window as any;
            if (ctx && drawUtils.drawConnectors) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              drawUtils.drawConnectors(ctx, landmarks, drawUtils.HAND_CONNECTIONS, {color: '#d4af37', lineWidth: 3});
              drawUtils.drawLandmarks(ctx, landmarks, {color: '#ffffff', lineWidth: 1, radius: 2});
            }
          }
        });
        detectorRef.current = hands;
      }
    };

    initMediaPipe();
  }, [setHandData, addRotationVelocity]);

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    isResizingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startRef.current = { x: clientX, y: clientY, w: dimensions.width, h: dimensions.height };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startRef.current.x;
      const dy = clientY - startRef.current.y;
      setDimensions({
        width: Math.max(80, startRef.current.w + dx),
        height: Math.max(60, startRef.current.h + dy)
      });
    };
    const handleStop = () => isResizingRef.current = false;
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleStop);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleStop);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleStop);
    };
  }, [dimensions]);

  const processFrame = async () => {
    if (videoRef.current && detectorRef.current && cameraOpenRef.current) {
      try { await detectorRef.current.send({ image: videoRef.current }); } catch (e) {}
      requestAnimationFrame(processFrame);
    }
  };

  const toggleCamera = async () => {
    if (cameraOpen) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setCameraOpen(false);
      cameraOpenRef.current = false;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: { ideal: 30 } } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setCameraOpen(true); cameraOpenRef.current = true; processFrame(); };
        }
      } catch (e) { alert("Camera access denied!"); }
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-500 ${uiVisible ? '' : 'opacity-0 pointer-events-none'}`}>
      <div 
        className="glass rounded-xl p-1 sm:p-2 flex flex-col items-center border border-white/20 shadow-2xl relative"
        style={{ width: dimensions.width + 16, height: dimensions.height + 48 }}
      >
        <div 
          className="relative bg-black/60 rounded-lg overflow-hidden border border-white/10 shadow-inner"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} width={160} height={120} className="w-full h-full scale-x-[-1]" />
          {!cameraOpen && (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] text-white/40 text-center px-1 flex-col gap-1">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span>AI VISION</span>
            </div>
          )}
          
          {/* Resize Handle */}
          <div 
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center group"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-gold opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        <button 
          onClick={toggleCamera} 
          className={`mt-2 text-[8px] sm:text-[10px] uppercase tracking-widest py-1 px-3 border rounded-full transition-all duration-300 shadow-lg ${cameraOpen ? 'border-red-500/50 bg-red-500/10 text-red-200' : 'border-gold/50 bg-gold/10 text-gold'}`}
        >
          {cameraOpen ? 'OFF' : 'ON'}
        </button>
      </div>
    </div>
  );
};

export default HandTracker;
