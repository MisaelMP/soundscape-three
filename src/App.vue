<script setup lang="ts">
	import { RouterView } from 'vue-router';
	import AppNavigation from '@/components/Navigation.vue';
</script>

<template>
	<div class="app">
		<AppNavigation />
		<main class="main-content">
			<router-view v-slot="{ Component }">
				<transition name="fade" mode="out-in">
					<component :is="Component" />
				</transition>
			</router-view>
		</main>
	</div>
</template>

<style>
	.app {
		min-height: 100vh;
		background: #000;
		color: #fff;
	}

	.main-content {
		padding-top: 4rem; /* Space for the fixed navigation */
	}

	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.3s ease;
	}

	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}
</style>
