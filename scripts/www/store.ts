
import { create } from 'zustand';
import { Phase, PhotoData, HandData } from './types';
import gsap from 'gsap';

interface AppState {
  phase: Phase;
  transitionFactor: number; 
  photos: PhotoData[];
  handData: HandData;
  uiVisible: boolean;
  isUiCollapsed: boolean; // 新增：UI是否折叠（磁吸）
  isLoading: boolean;
  focusedPhotoId: string | null;
  bgmPlaying: boolean;
  customBgmUrl: string | null;
  
  accumulatedRotation: { x: number; y: number };
  rotationVelocity: { x: number; y: number };

  setPhase: (phase: Phase) => void;
  setTransitionFactor: (factor: number) => void;
  addPhoto: (url: string) => void;
  addPhotoWithAspect: (url: string, aspect: number) => void;
  setHandData: (data: Partial<HandData>) => void;
  toggleUI: () => void;
  toggleCollapse: (val?: boolean) => void; // 新增：切换磁吸状态
  setLoading: (loading: boolean) => void;
  setFocusedPhoto: (id: string | null) => void;
  toggleBGM: () => void;
  setCustomBGM: (url: string | null) => void;
  
  addRotationVelocity: (vx: number, vy: number) => void;
  updateRotation: (x: number, y: number) => void;
  applyFriction: (friction: number) => void;
  resetRotation: (instant?: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  phase: 'tree',
  transitionFactor: 0,
  photos: [
    { id: '1', url: 'https://picsum.photos/id/10/800/1200', isCustom: false, aspectRatio: 0.66 },
    { id: '2', url: 'https://picsum.photos/id/20/1200/800', isCustom: false, aspectRatio: 1.5 },
    { id: '3', url: 'https://picsum.photos/id/30/1000/1000', isCustom: false, aspectRatio: 1.0 },
    { id: '4', url: 'https://picsum.photos/id/40/800/1200', isCustom: false, aspectRatio: 0.66 },
    { id: '5', url: 'https://picsum.photos/id/50/1200/800', isCustom: false, aspectRatio: 1.5 },
  ],
  handData: {
    gesture: 'None',
    rotation: { x: 0, y: 0 },
    position: { x: 0.5, y: 0.5 },
    active: false
  },
  uiVisible: true,
  isUiCollapsed: window.innerWidth < 640, // 移动端默认磁吸
  isLoading: true,
  focusedPhotoId: null,
  bgmPlaying: false,
  customBgmUrl: null,

  accumulatedRotation: { x: 0, y: 0 },
  rotationVelocity: { x: 0, y: 0 },

  setPhase: (phase) => set({ phase }),
  setTransitionFactor: (transitionFactor) => set({ transitionFactor }),
  
  addPhoto: (url) => get().addPhotoWithAspect(url, 1.0),

  addPhotoWithAspect: (url, aspect) => set((state) => {
    const photos = [...state.photos];
    const defaultIdx = photos.findIndex(p => !p.isCustom);
    if (defaultIdx !== -1) {
      photos[defaultIdx] = { id: `custom-${Date.now()}`, url, isCustom: true, aspectRatio: aspect };
      return { photos };
    } else {
      return { photos: [...photos, { id: `custom-${Date.now()}`, url, isCustom: true, aspectRatio: aspect }] };
    }
  }),

  setHandData: (data) => set((state) => ({ handData: { ...state.handData, ...data } })),
  toggleUI: () => set((state) => ({ uiVisible: !state.uiVisible })),
  toggleCollapse: (val) => set((state) => ({ isUiCollapsed: val !== undefined ? val : !state.isUiCollapsed })),
  setLoading: (loading) => set({ isLoading: loading }),
  setFocusedPhoto: (id) => set({ focusedPhotoId: id }),
  toggleBGM: () => set((state) => ({ bgmPlaying: !state.bgmPlaying })),
  setCustomBGM: (url) => set({ customBgmUrl: url }),

  addRotationVelocity: (vx, vy) => {
    if (get().phase === 'focus') return;
    set((state) => ({ rotationVelocity: { x: state.rotationVelocity.x + vx, y: state.rotationVelocity.y + vy } }));
  },
  updateRotation: (x, y) => set((state) => ({
    accumulatedRotation: { x: state.accumulatedRotation.x + x, y: state.accumulatedRotation.y + y }
  })),
  applyFriction: (friction) => set((state) => ({
    rotationVelocity: { x: state.rotationVelocity.x * friction, y: state.rotationVelocity.y * friction }
  })),
  resetRotation: (instant = false) => {
    set({ rotationVelocity: { x: 0, y: 0 } });
    if (instant) {
      set({ accumulatedRotation: { x: 0, y: 0 } });
    } else {
      const current = get().accumulatedRotation;
      gsap.to(current, { x: 0, y: 0, duration: 0.8, ease: "power3.out", onUpdate: () => set({ accumulatedRotation: { ...current } }) });
    }
  }
}));
