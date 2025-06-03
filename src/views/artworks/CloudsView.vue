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
		<Cloud
			v-for="(particles, uid) in smokeParticles"
			:key="uid"
			:user-id="uid"
			:particles="particles"
			:color="userColors[uid]"
			:base-radius="baseRadius"
			:user-index="getUserIndex(uid)"
		/>
	</BaseCanvas>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted, watch } from 'vue';
	import { useWebSocket } from '@/composables/useWebSocket';
	import * as THREE from 'three';
	import BaseCanvas from '@/components/BaseCanvas.vue';
	import { OrbitControls } from '@tresjs/cientos';
	import Cloud from '@/components/Cloud.vue';
	import type { Particle } from '@/types';

	// Initialize all reactive state and constants first
	const smokeParticles = ref<Record<string, Particle[]>>({});
	const userColors = ref<Record<string, THREE.Color>>({});
	const activeUsers = ref<Set<string>>(new Set());
	const baseRadius = 200;
	const clock = new THREE.Clock();
	let animationFrameId: number | null = null;

	// Setup WebSocket connection
	const {
		isConnected,
		messages,
		userId,
		error,
		connectedUsers,
		connect,
		disconnect,
		sendMessage,
	} = useWebSocket('collaborative-room');

	// Register lifecycle hooks first
	onMounted(() => {
		clock.start();
		animate();
		// Connect first, smoke will be initialized after connection
		connect();
	});

	onUnmounted(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		Object.keys(smokeParticles.value).forEach((uid) => {
			delete smokeParticles.value[uid];
			delete userColors.value[uid];
		});
		disconnect();
	});

	// Watch for connected users changes
	watch(connectedUsers, (newUsers) => {
		// Initialize smoke for each user if not already initialized
		newUsers.forEach((uid) => {
			if (!smokeParticles.value[uid]) {
				const particles = createParticles(uid);
				const color = assignColor(uid);
				smokeParticles.value[uid] = particles;

				// If this is our user, send initial state
				if (uid === userId.value) {
					sendMessage({
						type: 'update',
						userId: uid,
						timestamp: Date.now(),
						particles,
						color: color.getHex(),
					});
				}
			}
		});
	});

	// Watch for messages
	watch(messages, (newMessages) => {
		const latestMessage = newMessages[newMessages.length - 1];
		if (!latestMessage) return;

		switch (latestMessage.type) {
			case 'user_joined':
				if (latestMessage.userId !== userId.value) {
					connectedUsers.value.add(latestMessage.userId);
				}
				break;

			case 'update':
				if (latestMessage.userId && latestMessage.userId !== userId.value) {
					if (latestMessage.particles) {
						smokeParticles.value[latestMessage.userId] =
							latestMessage.particles;
					}
					if (latestMessage.color) {
						userColors.value[latestMessage.userId] = new THREE.Color(
							latestMessage.color
						);
					}
				}
				break;

			case 'user_left':
				if (latestMessage.userId) {
					delete smokeParticles.value[latestMessage.userId];
					delete userColors.value[latestMessage.userId];
					connectedUsers.value.delete(latestMessage.userId);
				}
				break;
		}
	});

	// Initialize when connected
	watch(isConnected, (connected) => {
		if (connected && userId.value) {
			const particles = createParticles(userId.value);
			const color = assignColor(userId.value);
			smokeParticles.value[userId.value] = particles;

			// Send initial state
			sendMessage({
				type: 'update',
				userId: userId.value,
				timestamp: Date.now(),
				particles,
				color: color.getHex(),
			});
		}
	});

	// Predefined colors for users
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

	// Track color assignments with a Map of hex values to user IDs
	const colorAssignments = ref<Map<number, string>>(new Map());

	const getNextAvailableColor = (): THREE.Color => {
		// First try to find an unassigned predefined color
		for (const color of predefinedColors) {
			const hex = color.getHex();
			if (!colorAssignments.value.has(hex)) {
				return color.clone();
			}
		}

		// If all predefined colors are taken, generate a random color
		const color = new THREE.Color(
			Math.random() * 0.7 + 0.3,
			Math.random() * 0.7 + 0.3,
			Math.random() * 0.7 + 0.3
		);
		return color;
	};

	const assignColor = (userId: string) => {
		const color = getNextAvailableColor();
		userColors.value[userId] = color;
		colorAssignments.value.set(color.getHex(), userId);
		return color;
	};

	const createParticles = (userId: string) => {
		const particles: Particle[] = [];
		const particleCount = 300;
		const offsetX = (Math.random() - 0.5) * 1000; // Random offset for each user

		for (let p = 0; p < particleCount; p++) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const r = Math.pow(Math.random(), 0.5) * baseRadius;

			particles.push({
				position: [
					r * Math.sin(phi) * Math.cos(theta) + offsetX,
					r * Math.sin(phi) * Math.sin(theta) + Math.random() * 100,
					r * Math.cos(phi),
				],
				rotation: Math.random() * 360,
				scale: 0.5 + Math.random() * 0.5,
				velocity: [
					(Math.random() - 0.5) * 0.2,
					Math.random() * 0.1,
					(Math.random() - 0.5) * 0.2,
				],
			});
		}

		return particles;
	};

	const evolveSmoke = () => {
		if (!isConnected.value || !userId.value) return;

		const ourParticles = smokeParticles.value[userId.value];
		if (!ourParticles) return;

		// Update our particles
		ourParticles.forEach((particle) => {
			particle.rotation += 0.01;
			particle.position[0] += particle.velocity[0];
			particle.position[1] += particle.velocity[1];
			particle.position[2] += particle.velocity[2];

			// Keep particles within bounds
			const bound = 1000;
			for (let i = 0; i < 3; i++) {
				if (Math.abs(particle.position[i]) > bound) {
					particle.velocity[i] *= -1;
					particle.position[i] = Math.sign(particle.position[i]) * bound;
				}
			}
		});

		// Send update
		sendMessage({
			type: 'update',
			userId: userId.value,
			timestamp: Date.now(),
			particles: ourParticles,
			color: userColors.value[userId.value].getHex(),
		});
	};

	const animate = () => {
		evolveSmoke();
		animationFrameId = requestAnimationFrame(animate);
	};

	// Helper functions
	const getUserIndex = (uid: string): number => {
		return Array.from(activeUsers.value).indexOf(uid);
	};

	const getOffsetForUser = (userId: string) => {
		const userIndex = getUserIndex(userId);
		const offsetX =
			(userIndex % 2 === 0 ? 1 : -1) *
			(Math.floor(userIndex / 2) + 1) *
			baseRadius *
			2;
		return offsetX;
	};

	const initSmoke = (targetUserId: string) => {
		if (!isConnected.value) {
			return;
		}

		const color = userColors.value[targetUserId] || 0xffffff;
		const particles = createParticles(targetUserId);
		assignColor(targetUserId);

		// Add new particles to state
		smokeParticles.value = {
			...smokeParticles.value,
			[targetUserId]: particles,
		};

		// If this is our own smoke, send initial state
		if (targetUserId === userId.value) {
			sendMessage({
				type: 'update',
				userId: targetUserId,
				particles,
				color: typeof color === 'number' ? color : color.getHex(),
				timestamp: Date.now(),
			});
		}
	};
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
