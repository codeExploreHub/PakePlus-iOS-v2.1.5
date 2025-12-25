
export type Phase = 'tree' | 'blooming' | 'nebula' | 'focus' | 'collapsing';

export interface PhotoData {
  id: string;
  url: string;
  isCustom: boolean;
  aspectRatio: number;
}

export interface HandData {
  gesture: string;
  rotation: { x: number; y: number };
  position: { x: number; y: number };
  active: boolean;
}
