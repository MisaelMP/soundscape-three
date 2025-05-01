import { createApp } from 'vue';
import { MotionPlugin } from '@vueuse/motion';
import Tres from '@tresjs/core'; // Corrected import statement
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);

app.use(router);
app.use(MotionPlugin);
app.use(Tres);

app.mount('#app');
