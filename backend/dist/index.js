"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongo_config_1 = __importDefault(require("./config/mongo.config"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const product_route_1 = __importDefault(require("./routes/product.route"));
const category_route_1 = __importDefault(require("./routes/category.route"));
const supplier_route_1 = __importDefault(require("./routes/supplier.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const env_1 = require("./config/env");
const cors_1 = __importDefault(require("cors"));
const search_route_1 = __importDefault(require("./routes/search.route"));
const coupon_route_1 = __importDefault(require("./routes/coupon.route"));
const redis_util_1 = require("./utils/redis.util");
const draftOrder_service_1 = require("./services/draftOrder.service");
const payment_route_2 = __importDefault(require("./routes/payment.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const admin_chat_route_1 = __importDefault(require("./routes/admin.chat.route"));
const socket_1 = require("./socket");
const chat_socket_1 = require("./socket/chat.socket");
const cart_route_1 = __importDefault(require("./routes/cart.route"));
const favorite_route_1 = __importDefault(require("./routes/favorite.route"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = env_1.env.port;
const FRONTEND_URL = process.env.FRONTEND_URL;
const FRONTEND_URL_2 = process.env.FRONTEND_URL_2;
// Middleware to parse JSON bodies
app.use(express_1.default.json());
// Middleware to parse cookies
app.use((0, cookie_parser_1.default)());
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    FRONTEND_URL,
    FRONTEND_URL_2
].filter(Boolean);
const allowedOriginPatterns = [
    /^https:\/\/pht-fashion-frontend[a-zA-Z0-9-]*\.vercel\.app$/,
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        if (allowedOriginPatterns.some((p) => p.test(origin)))
            return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
}));
// Connect to database inside bootstrap
// Health check route
app.get('/', (req, res) => {
    res.send('PHT-Fashion API is running');
});
// Routes
app.use('/api/auth', auth_route_1.default);
app.use('/api/users', user_route_1.default);
app.use('/api/admin/products', product_route_1.default);
app.use('/api/products', product_route_1.default);
app.use('/api/admin/categories', category_route_1.default);
app.use('/api/categories', category_route_1.default);
app.use('/api/admin/suppliers', supplier_route_1.default);
app.use('/api/suppliers', supplier_route_1.default);
app.use('/api/search', search_route_1.default);
app.use('/api/coupons', coupon_route_1.default);
app.use('/api/orders', order_route_1.default);
app.use('/api/payments', payment_route_1.default);
app.use('/api/pending-payments', payment_route_2.default);
app.use('/api/chats', chat_route_1.default);
app.use('/api/admin/chats', admin_chat_route_1.default);
app.use('/api/cart', cart_route_1.default);
app.use('/api/favorites', favorite_route_1.default);
const startServer = async () => {
    await (0, mongo_config_1.default)();
    await (0, redis_util_1.connectRedis)();
    const cleanupIntervalSeconds = Math.max(10, Number(process.env.DRAFT_CLEANUP_INTERVAL_SECONDS) || 60);
    setInterval(async () => {
        try {
            const cleaned = await (0, draftOrder_service_1.cleanupExpiredDrafts)();
            if (cleaned > 0) {
                console.log(`[Draft Cleanup] Restored stock for ${cleaned} expired drafts`);
            }
        }
        catch (error) {
            console.error('Draft cleanup failed', error);
        }
    }, cleanupIntervalSeconds * 1000);
    const httpServer = http_1.default.createServer(app);
    const io = (0, socket_1.initSocket)(httpServer);
    (0, chat_socket_1.registerChatHandlers)(io);
    app.set('io', io);
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API available at http://localhost:${PORT}`);
    });
};
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
