<template>
	<div class="home">
		<h1>Soundscape</h1>
		<p class="subtitle">Interactive Sound & Motion Art</p>
		
		<div class="scenes-grid">
			<router-link 
				v-for="scene in scenes" 
				:key="scene.path" 
				:to="scene.path"
				class="scene-card"
			>
				<h2>{{ scene.title }}</h2>
				<p>{{ scene.description }}</p>
			</router-link>
		</div>
	</div>
</template>

<script setup lang="ts">
const scenes = [
	{
		title: 'Sound Wave Visualization',
		description: 'Experience sound as a flowing wave of particles',
		path: '/scenes/sound-wave'
	},
	{
		title: 'Physics Playground',
		description: 'Interact with physics-based objects using sound and motion',
		path: '/scenes/physics'
	},
	{
		title: 'Shared Canvas',
		description: 'Collaborate with others in real-time',
		path: '/shared-canvas'
	}
]
</script>

<style scoped>
	.home {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		font-size: 3rem;
		margin-bottom: 0.5rem;
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		font-size: 1.2rem;
		color: #666;
		margin-bottom: 3rem;
	}

	.scenes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.scene-card {
		background: #fff;
		border-radius: 12px;
		padding: 1.5rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.scene-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.scene-card h2 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.scene-card p {
		margin: 0;
		color: #666;
	}
</style>
