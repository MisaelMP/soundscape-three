import { ref, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

interface WebSocketMessage {
	type: 'user_joined' | 'user_left' | 'init' | 'update' | 'ping' | 'pong';
	userId: string;
	timestamp: number;
	particles?: Array<{
		position: [number, number, number];
		rotation: number;
		scale: number;
		velocity: [number, number, number];
	}>;
	color?: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'localhost:3000';
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const useWebSocket = (roomId: string) => {
	const ws = ref<WebSocket | null>(null);
	const isConnected = ref(false);
	const messages = ref<string[]>([]);
	const userId = ref<string>(crypto.randomUUID());
	const reconnectAttempts = ref(0);
	const MAX_RECONNECT_ATTEMPTS = 5;

	const connect = () => {
		if (reconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
			console.error('Max reconnection attempts reached');
			return;
		}

		const wsUrl = `${WS_PROTOCOL}//${BACKEND_URL}/${roomId}`;
		console.log('Connecting to WebSocket:', wsUrl);

		ws.value = new WebSocket(wsUrl);

		ws.value.onopen = () => {
			console.log('WebSocket connected');
			isConnected.value = true;
			reconnectAttempts.value = 0;

			// Send join message after connection is established
			setTimeout(() => {
				sendMessage({
					type: 'user_joined',
					userId: userId.value,
					timestamp: Date.now(),
				});
			}, 100);
		};

		ws.value.onclose = () => {
			console.log('WebSocket disconnected');
			isConnected.value = false;

			// Send user_left message before attempting to reconnect
			if (ws.value) {
				sendMessage({
					type: 'user_left',
					userId: userId.value,
					timestamp: Date.now(),
				});
			}

			reconnectAttempts.value++;
			// Exponential backoff for reconnection
			const delay = Math.min(
				1000 * Math.pow(2, reconnectAttempts.value),
				10000
			);
			setTimeout(connect, delay);
		};

		ws.value.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		ws.value.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data) as WebSocketMessage;

				// Handle ping messages
				if (data.type === 'ping') {
					sendMessage({
						type: 'pong',
						userId: userId.value,
						timestamp: Date.now(),
					});
					return;
				}

				// Don't store ping/pong messages in the messages array
				if (data.type !== 'ping' && data.type !== 'pong') {
					messages.value.push(event.data);
				}

				console.log('Received message:', data.type, 'from user:', data.userId);
			} catch (error) {
				console.error('Error parsing WebSocket message:', error);
			}
		};
	};

	const sendMessage = (data: WebSocketMessage) => {
		if (ws.value?.readyState === WebSocket.OPEN) {
			ws.value.send(JSON.stringify(data));
		} else {
			console.warn('WebSocket is not connected. Message not sent:', data);
		}
	};

	const disconnect = () => {
		if (ws.value) {
			// Send user_left message before closing
			sendMessage({
				type: 'user_left',
				userId: userId.value,
				timestamp: Date.now(),
			});

			// Close the connection
			ws.value.close();
			ws.value = null;
			isConnected.value = false;
		}
	};

	// Set up connection on mount
	onMounted(() => {
		connect();
	});

	// Clean up on unmount
	onUnmounted(() => {
		disconnect();
	});

	return {
		isConnected,
		messages,
		userId,
		sendMessage,
		disconnect,
	};
};
