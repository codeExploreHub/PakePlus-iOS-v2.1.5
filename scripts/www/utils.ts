
import { Vector3 } from 'three';

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const getTreePosition = (index: number, total: number, time: number = 0) => {
  const t = index / total;
  const height = 28 * (1 - t);
  
  const baseRadius = 10 * t;
  const jitter = Math.sin(index * 123.45) * 0.8;
  const radius = baseRadius + jitter;
  
  const angle = t * 52 * Math.PI + time * 0.2 + (Math.sin(index) * 0.5);
  
  return new Vector3(
    Math.cos(angle) * radius,
    height - 14 + (Math.cos(index * 0.5) * 0.5),
    Math.sin(angle) * radius
  );
};

export const getNebulaPosition = (index: number, total: number, time: number = 0) => {
  const seed = Math.sin(index) * 10000;
  const r = 25 + (seed % 15);
  const theta = (seed % (Math.PI * 2)) + time * 0.05;
  const phi = ((seed * 1.3) % Math.PI);

  return new Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

export const getRandomPos = (index: number, spread: number = 50) => {
  const s = Math.sin(index) * 10000;
  const c = Math.cos(index * 1.2) * 10000;
  const z = Math.sin(index * 0.8) * 10000;
  return new Vector3(
    (s % spread),
    (c % spread),
    (z % spread)
  );
};

export const recognizeGesture = (landmarks: any[]) => {
  if (!landmarks || landmarks.length < 21) return 'None';
  
  const isExtended = (tipIdx: number, jointIdx: number) => landmarks[tipIdx].y < landmarks[jointIdx].y;
  
  const indexExtended = isExtended(8, 6);
  const middleExtended = isExtended(12, 10);
  const ringExtended = isExtended(16, 14);
  const pinkyExtended = isExtended(20, 18);

  // 1. 五指张开 -> Open Palm
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return 'Open Palm';
  }
  
  // 2. 握拳 -> Closed Fist
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return 'Closed Fist';
  }
  
  // 3. 捏合识别：食指尖 (8) 与大拇指尖 (4) 的欧几里得距离
  // 阈值调大到 0.12，并取消对中指的依赖限制，极大降低误操作可能
  const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  const pinchDist = dist(landmarks[4], landmarks[8]);
  
  if (pinchDist < 0.12) {
    return 'Pinch';
  }
  
  return 'None';
};
