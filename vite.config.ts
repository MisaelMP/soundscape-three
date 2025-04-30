import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { templateCompilerOptions } from '@tresjs/core';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			...templateCompilerOptions,
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		proxy: {
			'/ws': {
				target: process.env.VITE_BACKEND_URL || 'ws://localhost:3000',
				ws: true,
			},
		},
	},
});
