import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export function connectPipelineSocket() {
  return io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
