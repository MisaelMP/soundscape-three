<template>
	<BaseCanvas>
		<TresPerspectiveCamera :position="[0, 0, 3000]" />
		<TresDirectionalLight :position="[-1, 0, 1]" :intensity="1" />
		<OrbitControls
			:enable-damping="true"
			:damping-factor="0.05"
			:min-distance="1000"
			:max-distance="10000"
			:target="[0, 0, 0]"
			:enable-pan="false"
			:enable-rotate="false"
		/>
		<template v-for="(particles, uid) in smokeParticles" :key="uid">
			<TresMesh
				v-for="(particle, index) in particles"
				:key="`${uid}-${index}`"
				:position="particle.position"
				:rotation="[0, 0, particle.rotation]"
				:scale="[particle.scale, particle.scale, particle.scale]"
			>
				<TresPlaneGeometry :args="[300, 300]" />
				<TresMeshLambertMaterial
					:map="smokeTexture"
					:color="userColors[uid]"
					:transparent="true"
					:opacity="0.4"
					:depthWrite="false"
					:side="THREE.DoubleSide"
				/>
			</TresMesh>
		</template>
	</BaseCanvas>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted, watch } from 'vue';
	import { useWebSocket } from '@/composables/useWebSocket';
	import * as THREE from 'three';
	import BaseCanvas from '@/components/BaseCanvas.vue';
	import { OrbitControls } from '@tresjs/cientos';
	import { DoubleSide } from 'three';

	const roomId = 'collaborative-room';
	const smokeParticles = ref<Record<string, any[]>>({});
	const smokeTexture = ref(null);
	const userColors = ref<Record<string, THREE.Color>>({});
	const baseRadius = 200;
	let animationFrameId;
	let clock: THREE.Clock;
	let lastUpdateTime = 0;
	const UPDATE_INTERVAL = 1000 / 30;
	const activeUsers = ref<Set<string>>(new Set());

	// Predefined colors for users (more distinct colors)
	const predefinedColors = [
		new THREE.Color('#FF3366'), // Bright Pink
		new THREE.Color('#33FF66'), // Bright Green
		new THREE.Color('#3366FF'), // Bright Blue
		new THREE.Color('#FFCC33'), // Golden Yellow
		new THREE.Color('#FF33FF'), // Magenta
		new THREE.Color('#33FFFF'), // Cyan
		new THREE.Color('#FF6633'), // Orange
		new THREE.Color('#9933FF'), // Purple
	];

	let colorIndex = 0;

	const { isConnected, messages, userId, sendMessage, disconnect } =
		useWebSocket(roomId);

	// Handle incoming messages
	watch(messages, (newMessages) => {
		if (!newMessages?.length) return;

		const message = newMessages[newMessages.length - 1];
		if (!message) return;

		try {
			const data = JSON.parse(message);
			console.log('Received message:', data.type, 'from user:', data.userId);

			switch (data.type) {
				case 'user_joined':
					if (data.userId !== userId.value) {
						console.log('New user joined:', data.userId);
						activeUsers.value.add(data.userId);
						// Send our current state to the new user
						if (smokeParticles.value[userId.value]) {
							sendMessage({
								type: 'init',
								particles: smokeParticles.value[userId.value],
								userId: userId.value,
								color: userColors.value[userId.value].getHex(),
								timestamp: Date.now(),
							});
						}
					}
					break;

				case 'init':
					if (!smokeParticles.value[data.userId]) {
						console.log('Initializing new user smoke:', data.userId);
						activeUsers.value.add(data.userId);
						initSmoke(data.userId, data.color);
					}
					break;

				case 'update':
					if (
						data.userId !== userId.value &&
						activeUsers.value.has(data.userId)
					) {
						if (smokeParticles.value[data.userId] && data.particles) {
							smokeParticles.value[data.userId] = data.particles;
						} else if (!smokeParticles.value[data.userId]) {
							// Request init data if we don't have the user's particles
							sendMessage({
								type: 'user_joined',
								userId: userId.value,
								timestamp: Date.now(),
							});
						}
					}
					break;

				case 'user_left':
					if (smokeParticles.value[data.userId]) {
						delete smokeParticles.value[data.userId];
						delete userColors.value[data.userId];
						activeUsers.value.delete(data.userId);
						console.log('Removed smoke for user:', data.userId);
					}
					break;
			}
		} catch (error) {
			console.error('Error parsing message:', error);
		}
	});

	// Add connection status watcher
	watch(isConnected, (connected) => {
		if (connected) {
			console.log('Connected to WebSocket, sending join message');
			// The join message is now handled in useWebSocket
		} else {
			console.log('Disconnected from WebSocket, cleaning up other users');
			// Clean up particles when disconnected
			Object.keys(smokeParticles.value).forEach((uid) => {
				if (uid !== userId.value) {
					delete smokeParticles.value[uid];
					delete userColors.value[uid];
					activeUsers.value.delete(uid);
				}
			});
		}
	});

	// Initialize smoke particles for a specific user
	const initSmoke = (userId: string, initialColor?: number) => {
		console.log('Initializing smoke for user:', userId);
		if (smokeParticles.value[userId]) {
			console.log('Smoke already exists for user:', userId);
			return;
		}

		if (!clock) {
			clock = new THREE.Clock();
		}

		if (!smokeTexture.value) {
			const textureLoader = new THREE.TextureLoader();
			smokeTexture.value = textureLoader.load(
				'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png'
			);
		}

		// Assign color
		if (initialColor !== undefined) {
			userColors.value[userId] = new THREE.Color(initialColor);
		} else {
			userColors.value[userId] =
				predefinedColors[colorIndex % predefinedColors.length];
			colorIndex++;
		}

		// Create particles with offset based on user count
		const particles = [];
		const particleCount = 300;
		const userCount = Object.keys(smokeParticles.value).length;
		const offsetX =
			(userCount % 2 === 0 ? 1 : -1) *
			(Math.floor(userCount / 2) + 1) *
			baseRadius *
			2;

		for (let p = 0; p < particleCount; p++) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const r = Math.pow(Math.random(), 0.5) * baseRadius;

			const x = r * Math.sin(phi) * Math.cos(theta) + offsetX;
			const y = r * Math.sin(phi) * Math.sin(theta);
			const z = r * Math.cos(phi);

			const yOffset = Math.random() * 100;

			particles.push({
				position: [x, y + yOffset, z],
				rotation: Math.random() * 360,
				scale: 0.5 + Math.random() * 0.5,
				velocity: [
					(Math.random() - 0.5) * 0.2,
					Math.random() * 0.1,
					(Math.random() - 0.5) * 0.2,
				],
			});
		}

		smokeParticles.value[userId] = particles;

		// Broadcast state to other users
		if (isConnected.value) {
			sendMessage({
				type: 'init',
				particles: particles,
				userId: userId,
				color: userColors.value[userId].getHex(),
				timestamp: Date.now(),
			});
		}
	};

	const evolveSmoke = () => {
		const delta = clock.getDelta();

		Object.entries(smokeParticles.value).forEach(([uid, particles]) => {
			particles.forEach((particle) => {
				particle.rotation += delta * 0.2;

				particle.position[0] += particle.velocity[0] * delta;
				particle.position[1] += particle.velocity[1] * delta;
				particle.position[2] += particle.velocity[2] * delta;

				particle.position[0] +=
					Math.sin(clock.elapsedTime * 0.1 + particle.position[1] * 0.01) *
					delta *
					0.5;
				particle.position[2] +=
					Math.cos(clock.elapsedTime * 0.1 + particle.position[1] * 0.01) *
					delta *
					0.5;

				const distance = Math.sqrt(
					particle.position[0] * particle.position[0] +
						particle.position[1] * particle.position[1] +
						particle.position[2] * particle.position[2]
				);

				if (distance > baseRadius * 2) {
					particle.position = [
						(Math.random() - 0.5) * baseRadius * 0.5,
						-baseRadius,
						(Math.random() - 0.5) * baseRadius * 0.5,
					];
					particle.velocity = [
						(Math.random() - 0.5) * 0.2,
						Math.random() * 0.1,
						(Math.random() - 0.5) * 0.2,
					];
				}
			});
		});

		// Send updates at a fixed interval
		if (Date.now() - lastUpdateTime >= UPDATE_INTERVAL && isConnected.value) {
			sendMessage({
				type: 'update',
				particles: smokeParticles.value[userId.value],
				userId: userId.value,
				timestamp: Date.now(),
			});
			lastUpdateTime = Date.now();
		}
	};

	const animate = () => {
		evolveSmoke();
		animationFrameId = requestAnimationFrame(animate);
	};

	onMounted(() => {
		console.log('Component mounted, initializing for user:', userId.value);
		initSmoke(userId.value);
		animate();
	});

	onUnmounted(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		// Clean up particles and disconnect
		Object.keys(smokeParticles.value).forEach((uid) => {
			delete smokeParticles.value[uid];
			delete userColors.value[uid];
		});
		disconnect();
	});
</script>

<style scoped>
	canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: transparent;
	}
</style>
