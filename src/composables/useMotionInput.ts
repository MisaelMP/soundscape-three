import { ref, onMounted, onUnmounted } from 'vue';
import type { MotionData } from '../types';

export function useMotionInput() {
	const motionData = ref<MotionData>({
		acceleration: { x: 0, y: 0, z: 0 },
		rotation: { alpha: 0, beta: 0, gamma: 0 },
	});

	const handleMotion = (event: DeviceMotionEvent) => {
		if (event.acceleration) {
			motionData.value.acceleration = {
				x: event.acceleration.x || 0,
				y: event.acceleration.y || 0,
				z: event.acceleration.z || 0,
			};
		}
	};

	const handleOrientation = (event: DeviceOrientationEvent) => {
		motionData.value.rotation = {
			alpha: event.alpha || 0,
			beta: event.beta || 0,
			gamma: event.gamma || 0,
		};
	};

	onMounted(() => {
		if (window.DeviceMotionEvent) {
			window.addEventListener('devicemotion', handleMotion);
		}
		if (window.DeviceOrientationEvent) {
			window.addEventListener('deviceorientation', handleOrientation);
		}
	});

	onUnmounted(() => {
		window.removeEventListener('devicemotion', handleMotion);
		window.removeEventListener('deviceorientation', handleOrientation);
	});

	return {
		motionData,
	};
}
