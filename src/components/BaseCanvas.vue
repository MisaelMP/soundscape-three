<template>
	<div class="canvas-container" ref="container">
		<TresCanvas>
			<TresPerspectiveCamera :position="[0, 0, 3]" />
			<TresAmbientLight :intensity="1" />
			<OrbitControls :enable-damping="true" :damping-factor="0.05" />
			<slot />
		</TresCanvas>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from 'vue';
	import { OrbitControls } from '@tresjs/cientos';

	const container = ref<HTMLElement | null>(null);

	// Store handler functions to properly remove them later
	const wheelHandler = () => {};
	const touchStartHandler = () => {};
	const touchMoveHandler = () => {};

	onMounted(() => {
		if (container.value) {
			container.value.addEventListener('wheel', wheelHandler, {
				passive: true,
			});
			container.value.addEventListener('touchstart', touchStartHandler, {
				passive: true,
			});
			container.value.addEventListener('touchmove', touchMoveHandler, {
				passive: true,
			});
		}
	});

	onUnmounted(() => {
		if (container.value) {
			container.value.removeEventListener('wheel', wheelHandler);
			container.value.removeEventListener('touchstart', touchStartHandler);
			container.value.removeEventListener('touchmove', touchMoveHandler);
		}
	});
</script>

<style scoped>
	.canvas-container {
		width: 100vw;
		height: calc(100vh - 4rem); /* Subtract navbar height */
		position: fixed;
		top: 4rem; /* Start below navbar */
		left: 0;
		background: #000;
		overflow: hidden;
	}
</style>
