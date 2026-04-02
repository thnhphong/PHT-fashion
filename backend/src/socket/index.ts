import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../config/jwt';

export interface SocketUser {
  sub: string;
  role: string;
  email: string;
}

export const initSocket = (httpServer: HttpServer): Server => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_2,
  ].filter((o): o is string => Boolean(o));
  const originPatterns = [/^https:\/\/pht-fashion-frontend[a-zA-Z0-9-]*\.vercel\.app$/];

  const io = new Server(httpServer, {
    cors: {
      origin: origins.length > 0 ? [...origins, ...originPatterns] : true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyToken(token);
      socket.data.user = payload as SocketUser;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;
    if (user?.role === 'admin') {
      socket.join('admin_inbox');
    }
  });

  return io;
};
