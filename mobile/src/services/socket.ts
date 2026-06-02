import { io as ioClient, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { storage } from '../utils/storage';

const BASE = API_URL.replace('/api/v1', '');

let socket: Socket | null = null;

export function connectSocket() {
  const token = storage.getString('access_token');
  if (!token) return;

  socket = ioClient(BASE, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('[Socket] Подключён'));
  socket.on('disconnect', () => console.log('[Socket] Отключён'));
  socket.on('connect_error', (e) => console.warn('[Socket] Ошибка:', e.message));

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() { return socket; }

export function joinOrder(orderId: string) {
  socket?.emit('order:join', orderId);
}

export function leaveOrder(orderId: string) {
  socket?.emit('order:leave', orderId);
}
