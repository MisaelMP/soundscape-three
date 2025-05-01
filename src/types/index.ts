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
export interface Particle {
	position: [number, number, number];
	rotation: number;
	scale: number;
	velocity: [number, number, number];
}

// src/types.ts
export type Vec3 = { x: number; y: number; z: number };

export type CloudUser = {
	id: string;
	color: string;
	position: Vec3;
};

export interface Particle {
	position: [number, number, number];
	rotation: number;
	scale: number;
	velocity: [number, number, number];
}

export interface User {
	id: string;
	color: number;
	particles?: Particle[];
	lastUpdate: number;
}

export interface Message {
	type: 'user_joined' | 'user_left' | 'update';
	userId: string;
	timestamp: number;
	particles?: Particle[];
	color?: number;
}
