import { ref, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import type { Message, User } from '../types';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const useWebSocket = (roomId: string) => {
	const socket = ref<Socket | null>(null);
	const isConnected = ref(false);
	const messages = ref<Message[]>([]);
	const userId = ref<string>(uuidv4());
	const error = ref<string | null>(null);
	const connectedUsers = ref<Set<string>>(new Set());

	const connect = () => {
		if (socket.value?.connected) return;

		console.log('Connecting to WebSocket server with userId:', userId.value);
		socket.value = io(BACKEND_URL, {
			query: {
				roomId,
				userId: userId.value,
			},
			transports: ['websocket', 'polling'],
			withCredentials: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socket.value.on('connect', () => {
			console.log('Connected to server with userId:', userId.value);
			isConnected.value = true;
			error.value = null;
			connectedUsers.value.add(userId.value);
		});

		socket.value.on('disconnect', () => {
			isConnected.value = false;
			connectedUsers.value.clear();
		});

		socket.value.on('connect_error', (err) => {
			console.error('Connection error:', err);
			error.value = `Connection error: ${err.message}`;
		});

		socket.value.on('id', (id: string) => {
			console.log('Received ID:', id);
			userId.value = id;
			connectedUsers.value.add(id);
		});

		socket.value.on('message', (message: Message) => {
			messages.value.push(message);

			// Keep only last 10 messages
			if (messages.value.length > 10) {
				messages.value = messages.value.slice(-10);
			}
		});

		socket.value.on('clients', (clients: User[]) => {
			// Update connected users
			const newUsers = new Set<string>();
			clients.forEach((client) => {
				newUsers.add(client.id);
			});
			connectedUsers.value = newUsers;
		});

		socket.value.on('error', (err: { message: string }) => {
			console.error('Socket error:', err);
			error.value = err.message;
		});
	};

	const disconnect = () => {
		if (!socket.value) return;
		console.log('Disconnecting from server...');
		socket.value.disconnect();
		socket.value = null;
		isConnected.value = false;
		messages.value = [];
		error.value = null;
		connectedUsers.value.clear();
	};

	const sendMessage = (message: Message) => {
		if (!socket.value?.connected) {
			console.warn('Cannot send message: not connected');
			return;
		}

		console.log('Sending message:', {
			...message,
			userId: userId.value,
		});

		socket.value.emit('update', {
			...message,
			userId: userId.value,
			particles: message.particles,
			color: message.color,
		});
	};

	// Cleanup on component unmount
	onUnmounted(() => {
		disconnect();
	});

	return {
		isConnected,
		messages,
		userId,
		error,
		connectedUsers,
		connect,
		disconnect,
		sendMessage,
	};
};
