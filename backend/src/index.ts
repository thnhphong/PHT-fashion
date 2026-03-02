import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/mongo.config';
import userRoutes from './routes/user.route';
import authRoutes from './routes/auth.route';
import productRoutes from './routes/product.route';
import categoryRoutes from './routes/category.route';
import supplierRoutes from './routes/supplier.route';
import orderRoutes from './routes/order.route';
import paymentRoutes from './routes/payment.route';
import { env } from './config/env';
import cors from 'cors';
import searchRoutes from './routes/search.route';
import couponRoutes from './routes/coupon.route';
import { connectRedis } from './utils/redis.util';
import { cleanupExpiredDrafts } from './services/draftOrder.service';

dotenv.config();

const app: Application = express();
const PORT = env.port;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  FRONTEND_URL,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Connect to database inside bootstrap

// Health check route
app.get('/', (req, res) => {
  res.send('PHT-Fashion API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/suppliers', supplierRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);


const startServer = async () => {
  await connectDB();
  await connectRedis();
  const cleanupIntervalSeconds = Math.max(
    10,
    Number(process.env.DRAFT_CLEANUP_INTERVAL_SECONDS) || 60
  );
  setInterval(async () => {
    try {
      const cleaned = await cleanupExpiredDrafts();
      if (cleaned > 0) {
        console.log(`[Draft Cleanup] Restored stock for ${cleaned} expired drafts`);
      }
    } catch (error) {
      console.error('Draft cleanup failed', error);
    }
  }, cleanupIntervalSeconds * 1000);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});