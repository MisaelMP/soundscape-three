import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'home',
		component: () => import('../views/HomeView.vue'),
	},
	{
		path: '/particles',
		name: 'particles',
		component: () => import('../views/artworks/SinapsisView.vue'),
	},
	{
		path: '/fluid',
		name: 'fluid',
		component: () => import('../views/artworks/FluidView.vue'),
	},
	{
		path: '/waveform',
		name: 'waveform',
		component: () => import('../views/artworks/WaveformView.vue'),
	},
	{
		path: '/collaborative',
		name: 'collaborative',
		component: () => import('../views/artworks/CollaborativeView.vue'),
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
