import express, { Application } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongo.config';
import userRoutes from './routes/user.route';
import authRoutes from './routes/auth.route';
import productRoutes from './routes/product.route';
import categoryRoutes from './routes/category.route';
import supplierRoutes from './routes/supplier.route';
import { env } from './config/env';
import cors from 'cors';
import searchRoutes from './routes/search.route';
dotenv.config();

const app: Application = express();
const PORT = env.port;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Connect to database
connectDB();

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});