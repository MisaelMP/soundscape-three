<template>
	<div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from 'vue';
	import * as THREE from 'three';
	import { useWebSocket, useDeviceMotion } from '@vueuse/core';

	const canvasContainer = ref<HTMLDivElement | null>(null);
	const { send, data } = useWebSocket('ws://localhost:8080');
	const motion = useDeviceMotion();

	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let cube: THREE.Mesh;

	onMounted(() => {
		// Initialize Three.js scene
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		canvasContainer.value?.appendChild(renderer.domElement);

		// Add a cube
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		camera.position.z = 5;

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate);

			// Apply motion data to cube rotation
			if (motion.accelerationIncludingGravity) {
				const { x, y } = motion.accelerationIncludingGravity;
				cube.rotation.x += x * 0.01;
				cube.rotation.y += y * 0.01;
			}

			renderer.render(scene, camera);
		};
		animate();

		// WebSocket: Send and receive cube rotation
		send(JSON.stringify({ type: 'join', room: 'default' }));
		data.value && (cube.rotation.x = JSON.parse(data.value).x);

		// Capture sound input
		const audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)();
		navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
			const analyser = audioContext.createAnalyser();
			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			const visualize = () => {
				analyser.getByteFrequencyData(dataArray);
				const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
				cube.scale.set(1 + average / 256, 1 + average / 256, 1 + average / 256);
				requestAnimationFrame(visualize);
			};
			visualize();
		});
	});
</script>

<style>
	.canvas-container {
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}
</style>
