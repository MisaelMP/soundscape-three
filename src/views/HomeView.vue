<template>
	<div class="home">
		<section class="artwork-grid">
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
		</section>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';

	const artworks = ref([
		{
			title: 'Sinapsis',
			description:
				'Interactive particle system that poetically mimics the neural network',
			path: '/sinapsis',
		},
		{
			title: 'Fluid',
			description: 'Fluid simulation amorphous shape that responds to sound',
			path: '/fluid',
		},
		{
			title: 'Waveform',
			description: 'Visualize your sound through dynamic waveforms',
			path: '/waveform',
		},
		{
			title: 'Clouds',
			description:
				'A shared space that detects other users in real-time using web sockets, every user will be assigned a colour and cloud shapes will be generated based on the users in the room',
			path: '/clouds',
		},
	]);
</script>

<style scoped>
	.home {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		color: white;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.artwork-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		padding-bottom: 2rem;
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

	@media (max-width: 768px) {
		.home {
			padding: 5rem 1rem 1rem;
		}

		.artwork-grid {
			gap: 1rem;
		}

		.artwork-link {
			padding: 1.5rem;
		}
	}
</style>
