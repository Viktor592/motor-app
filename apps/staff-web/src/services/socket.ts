import { io, Socket } from 'socket.io-client';
let socket: Socket | null = null;

export function connectSocket() {
  const token = localStorage.getItem('access_token');
  if (!token || socket?.connected) return;
  socket = io('/', { auth: { token }, transports: ['websocket'] });
  socket.on('connect',       () => console.log('[WS] connected'));
  socket.on('disconnect',    () => console.log('[WS] disconnected'));
}
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
export const getSocket = () => socket;
export const joinOrder = (id: string) => socket?.emit('order:join', id);
export const leaveOrder = (id: string) => socket?.emit('order:leave', id);
