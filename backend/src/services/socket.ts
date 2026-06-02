import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth';

export function initSocket(io: Server) {
  // Auth middleware для Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Токен не предоставлен'));
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Токен недействителен'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    console.log(`[Socket] Подключился: ${user.userId} (${user.role})`);

    // Подписать на личный канал
    socket.join(`user:${user.userId}`);

    // Подписать на заказ
    socket.on('order:join', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('order:leave', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Отключился: ${user.userId}`);
    });
  });
}
