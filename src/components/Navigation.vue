<template>
	<nav class="navigation">
		<div class="nav-container">
			<button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
				<div class="hamburger" :class="{ 'is-active': isMenuOpen }">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</button>
			<div class="nav-links" :class="{ 'is-active': isMenuOpen }">
				<router-link to="/" class="nav-link" @click="closeMenu"
					>Home</router-link
				>
				<router-link to="/sinapsis" class="nav-link" @click="closeMenu"
					>Sinapsis</router-link
				>
				<router-link to="/fluid" class="nav-link" @click="closeMenu"
					>Fluid</router-link
				>
				<router-link to="/waveform" class="nav-link" @click="closeMenu"
					>Waveform</router-link
				>
				<router-link to="/Clouds" class="nav-link" @click="closeMenu"
					>Clouds</router-link
				>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
	import { ref } from 'vue';

	const isMenuOpen = ref(false);

	const toggleMenu = () => {
		isMenuOpen.value = !isMenuOpen.value;
	};

	const closeMenu = () => {
		isMenuOpen.value = false;
	};
</script>

<style scoped>
	.navigation {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		z-index: 1000;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
	}

	.hamburger {
		width: 24px;
		height: 20px;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.hamburger span {
		display: block;
		width: 100%;
		height: 2px;
		background-color: #fff;
		transition: all 0.3s ease;
	}

	.hamburger.is-active span:nth-child(1) {
		transform: translateY(9px) rotate(45deg);
	}

	.hamburger.is-active span:nth-child(2) {
		opacity: 0;
	}

	.hamburger.is-active span:nth-child(3) {
		transform: translateY(-9px) rotate(-45deg);
	}

	.nav-links {
		display: flex;
		gap: 1rem;
		align-items: center;
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

	@media (max-width: 768px) {
		.nav-container {
			height: 4rem;
		}

		.menu-toggle {
			display: block;
		}

		.nav-links {
			position: fixed;
			top: 4rem;
			left: 0;
			right: 0;
			background: rgba(0, 0, 0, 0.9);
			backdrop-filter: blur(10px);
			flex-direction: column;
			padding: 1rem;
			gap: 0.5rem;
			transform: translateY(-100%);
			opacity: 0;
			visibility: hidden;
			transition: all 0.3s ease;
		}

		.nav-links.is-active {
			transform: translateY(0);
			opacity: 1;
			visibility: visible;
		}

		.nav-link {
			width: 100%;
			text-align: center;
			padding: 0.75rem;
		}
	}
</style>
