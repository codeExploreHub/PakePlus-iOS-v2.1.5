
import React, { useRef } from 'react';
import { useStore } from '../store';

const UIOverlay: React.FC = () => {
  const { 
    phase, 
    uiVisible, 
    isUiCollapsed,
    toggleCollapse,
    handData, 
    isLoading, 
    setLoading, 
    bgmPlaying, 
    toggleBGM,
    setCustomBGM,
    customBgmUrl
  } = useStore();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          const img = new Image();
          img.onload = () => {
            const aspect = img.width / img.height;
            useStore.getState().addPhotoWithAspect(dataUrl, aspect);
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBGM(url);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div className="spinner mb-4" />
        <h2 className="text-gold tracking-[0.5em] text-sm uppercase gold-text">Loading Holiday Magic</h2>
        <button 
          onClick={() => setLoading(false)}
          className="mt-8 border border-white/20 px-6 py-2 rounded-full text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
        >
          Begin Journey
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Title */}
      <div className={`fixed inset-0 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-1000 ${phase === 'tree' ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-['Cinzel'] gold-text tracking-wider text-center drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] leading-tight">
          Merry <br className="sm:hidden" /> Christmas
        </h1>
        <p className="text-white/40 uppercase tracking-[0.4em] text-[10px] sm:text-xs mt-4">2024 Ultimate Edition</p>
      </div>

      {/* Collapse Toggle Tab (Mobile Only) */}
      <button 
        onClick={() => toggleCollapse()}
        className={`fixed top-1/2 -translate-y-1/2 right-0 z-[60] glass p-3 rounded-l-2xl border-r-0 border-gold/30 transition-all duration-500 shadow-2xl sm:hidden ${isUiCollapsed ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-5 h-5 text-gold animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          <span className="text-[8px] gold-text uppercase [writing-mode:vertical-lr] tracking-widest font-bold">Menu</span>
        </div>
      </button>

      {/* Side UI Panel */}
      <div 
        className={`fixed top-1/2 -translate-y-1/2 right-0 z-50 p-4 sm:p-6 transition-all duration-700 ease-in-out flex flex-col items-end gap-3 sm:gap-6 
        ${uiVisible ? '' : 'opacity-0 pointer-events-none translate-x-24'} 
        ${isUiCollapsed ? 'translate-x-full opacity-0 sm:translate-x-0 sm:opacity-100' : 'translate-x-0 opacity-100'}`}
      >
        {/* Close Button (Mobile Only) */}
        <button 
          onClick={() => toggleCollapse(true)}
          className="sm:hidden mb-2 p-2 rounded-full glass border-white/20 text-white/40 active:bg-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Status Panel */}
        <div className="glass px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl flex flex-col items-end min-w-[160px] sm:min-w-[220px] shadow-xl border border-white/10">
          <span className="text-[8px] sm:text-[10px] text-white/40 uppercase tracking-widest mb-1">Status</span>
          <span className="text-[10px] sm:text-sm font-bold gold-text uppercase mb-2">
            {handData.active ? (handData.gesture === 'None' ? 'Tracking' : handData.gesture) : 'Awakening...'}
          </span>
          <div className="h-px w-full bg-white/10 mb-2" />
          <span className="text-[7px] sm:text-[9px] text-white/30 italic text-right leading-relaxed whitespace-pre-line">
            {phase === 'tree' ? 'Open Palm to Bloom' : phase === 'nebula' ? 'Closed Fist to Collapse\nPinch to Focus' : 'Pinch for Memory'}
          </span>
        </div>

        {/* Music Player Control */}
        <div className="glass px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl flex flex-col items-center gap-2 sm:gap-3 shadow-xl border border-white/10 w-full max-w-[160px] sm:max-w-[220px]">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <button onClick={toggleBGM} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold/20 transition-all border border-gold/30 shadow-inner shrink-0">
              {bgmPlaying ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>
            <div className="flex-1 overflow-hidden">
              <div className="whitespace-nowrap text-[7px] sm:text-[10px] tracking-widest gold-text uppercase animate-marquee">
                {customBgmUrl ? "Custom Track" : "Merry Christmas Lawrence"}
              </div>
            </div>
          </div>
          <div className="relative w-full">
            <input type="file" ref={audioInputRef} onChange={handleAudioUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="audio/*" />
            <div className="w-full py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-1 sm:gap-2 hover:bg-white/10 transition-all">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              <span className="text-[7px] sm:text-[9px] uppercase tracking-tighter text-white/60">Load Music</span>
            </div>
          </div>
        </div>

        {/* Photo Uploader */}
        <div className="relative group w-full max-w-[160px] sm:max-w-[220px]">
          <input type="file" ref={photoInputRef} onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
          <div className="glass px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 group-hover:bg-gold/10 transition-all border border-gold/20 shadow-xl w-full">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest gold-text">Add Photo</span>
          </div>
        </div>

        <div className="mt-2 text-right text-white/20 text-[6px] sm:text-[8px] uppercase tracking-[0.2em] leading-relaxed max-w-[140px] sm:max-w-[180px]">
          'H' to Toggle UI<br className="hidden sm:block" />
          <span className="hidden sm:inline">Drag to Orbit • Pinch to Zoom</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 8s linear infinite; }
      `}</style>
    </>
  );
};

export default UIOverlay;
