import express, { Application } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongo.config';
import userRoutes from './routes/user.route';
import authRoutes from './routes/auth.route';
import { env } from './config/env';
import cors from 'cors';

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});