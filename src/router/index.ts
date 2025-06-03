import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'home',
		component: () => import('../views/HomeView.vue'),
	},
	{
		path: '/sinapsis',
		name: 'sinapsis',
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
		path: '/clouds',
		name: 'clouds',
		component: () => import('../views/artworks/CloudsView.vue'),
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
