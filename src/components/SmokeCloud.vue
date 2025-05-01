<template>
	<TresGroup>
		<TresMesh
			v-for="(particle, index) in particles"
			:key="`${userId}-${index}`"
			:position="particle.position"
			:rotation="[0, 0, particle.rotation]"
			:scale="[particle.scale, particle.scale, particle.scale]"
		>
			<TresPlaneGeometry :args="[300, 300]" />
			<TresMeshLambertMaterial
				v-if="smokeTexture"
				:map="smokeTexture"
				:color="color"
				:transparent="true"
				:opacity="0.4"
				:depthWrite="false"
				:side="THREE.DoubleSide"
				:blending="THREE.AdditiveBlending"
			/>
			<!-- Fallback material while texture is loading -->
			<TresMeshBasicMaterial
				v-else
				:color="color"
				:transparent="true"
				:opacity="0.2"
				:blending="THREE.AdditiveBlending"
			/>
		</TresMesh>
	</TresGroup>
</template>

<script setup lang="ts">
	import { ref, onMounted, watch } from 'vue';
	import * as THREE from 'three';
	import type { Particle } from '@/types';

	const props = defineProps<{
		userId: string;
		particles: Particle[];
		color: THREE.Color;
		baseRadius: number;
		userIndex: number;
	}>();

	// Create a shared texture for all particles
	const smokeTexture = ref<THREE.Texture | null>(null);

	onMounted(async () => {
		const textureLoader = new THREE.TextureLoader();
		try {
			smokeTexture.value = await new Promise((resolve, reject) => {
				textureLoader.load(
					'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png',
					(texture) => {
						console.log(
							`Smoke texture loaded successfully for user ${props.userId}`
						);
						resolve(texture);
					},
					undefined,
					(error) => {
						console.error(
							`Error loading smoke texture for user ${props.userId}:`,
							error
						);
						reject(error);
					}
				);
			});
		} catch (error) {
			console.error(
				`Failed to load smoke texture for user ${props.userId}:`,
				error
			);
		}
	});
</script>
