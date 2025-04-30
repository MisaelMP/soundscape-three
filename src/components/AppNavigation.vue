<template>
	<nav class="app-navigation">
		<router-link to="/" class="nav-link">Home</router-link>
		<router-link to="/particles" class="nav-link">Particles</router-link>
		<router-link to="/fluid" class="nav-link">Fluid</router-link>
		<router-link to="/waveform" class="nav-link">Waveform</router-link>
		<router-link to="/collaborative" class="nav-link"
			>Collaborative</router-link
		>
	</nav>
</template>

<script setup lang="ts">
	// No additional setup needed
</script>

<style scoped>
	.app-navigation {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		z-index: 1000;
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.nav-link {
		color: #fff;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background-color 0.3s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.router-link-active {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
