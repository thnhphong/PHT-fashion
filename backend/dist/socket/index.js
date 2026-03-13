"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../config/jwt");
const initSocket = (httpServer) => {
    const origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL_2,
    ].filter((o) => Boolean(o));
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: origins.length > 0 ? origins : true,
            methods: ['GET', 'POST'],
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const payload = (0, jwt_1.verifyToken)(token);
            socket.data.user = payload;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (user?.role === 'admin') {
            socket.join('admin_inbox');
        }
    });
    return io;
};
exports.initSocket = initSocket;
