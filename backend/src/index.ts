import express, { Application } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongo.config';
import userRoutes from './routes/user.route';
import { env } from './config/env';
import cors from 'cors';

dotenv.config();

const app: Application = express();
const PORT = env.port;

//middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
connectDB()

app.get('/', (req, res) => {
  res.send('api is running');
})

app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});