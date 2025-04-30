<template>
	<div class="home">
		<nav class="artwork-nav">
			<router-link
				v-for="artwork in artworks"
				:key="artwork.path"
				:to="artwork.path"
				class="artwork-link"
				v-motion
				:initial="{ opacity: 0, y: 20 }"
				:enter="{ opacity: 1, y: 0 }"
				:hover="{ scale: 1.05 }"
			>
				<h2>{{ artwork.title }}</h2>
				<p>{{ artwork.description }}</p>
			</router-link>
		</nav>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';

	const artworks = ref([
		{
			title: 'Particle Symphony',
			description: 'Interactive particle system that dances to your voice',
			path: '/particles',
		},
		{
			title: 'Fluid Dreams',
			description: 'Fluid simulation that responds to motion and sound',
			path: '/fluid',
		},
		{
			title: 'Waveform Journey',
			description: 'Visualize your sound through dynamic waveforms',
			path: '/waveform',
		},
		{
			title: 'Collaborative Canvas',
			description: 'Create art together with friends in real-time',
			path: '/collaborative',
		},
	]);
</script>

<style scoped>
	.home {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		color: white;
	}

	.artwork-nav {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.artwork-link {
		background: rgba(255, 255, 255, 0.1);
		padding: 2rem;
		border-radius: 1rem;
		text-decoration: none;
		color: white;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	.artwork-link:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-5px);
	}

	h2 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
	}

	p {
		margin: 0;
		opacity: 0.8;
		font-size: 1rem;
		line-height: 1.5;
	}
</style>
