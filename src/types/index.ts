export interface SoundData {
  frequency: number;
  amplitude: number;
  waveform: Float32Array;
}

export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

export interface CanvasState {
  id: string;
  users: string[];
  objects: CanvasObject[];
}

export interface CanvasObject {
  id: string;
  type: 'particle' | 'wave' | 'geometry';
  position: {
    x: number;
    y: number;
    z: number;
  };
  properties: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  color: string;
} 