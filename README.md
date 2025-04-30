# Soundscape

An interactive sound and motion-based artwork application built with Vue 3, TypeScript, and Three.js.

## Features

- Interactive particle systems that react to sound input
- Real-time collaboration through WebSocket
- Multiple artwork scenes with different physics simulations
- Motion and sound-based interactions

## Project Structure

```
soundscape-three/
├── src/               # Frontend source code
├── public/           # Static assets
├── index.html        # Entry HTML file
└── vite.config.ts    # Vite configuration
```

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
# Backend configuration
VITE_BACKEND_URL=your-backend-url:port

# Other configuration options
VITE_APP_TITLE=Soundscape
VITE_WS_RECONNECT_TIMEOUT=5000
```

## Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. The application will be available at `http://localhost:5173`

## Connecting to Your Backend

The application is configured to connect to a WebSocket backend. To connect to your external backend:

1. Set the `VITE_BACKEND_URL` in your `.env` file to point to your backend server
2. Make sure your backend server:
   - Accepts WebSocket connections at `/ws/:roomId`
   - Handles the following message types:
     - `position`: User position updates
     - `sound`: Sound input data
     - `motion`: Motion input data
     - `user_joined`: New user connection
     - `user_left`: User disconnection

## Message Format

WebSocket messages follow this format:

```typescript
interface WebSocketMessage {
	type: 'position' | 'sound' | 'motion' | 'user_joined' | 'user_left';
	data: any;
	userId: string;
}
```

## Building for Production

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

## License

MIT
