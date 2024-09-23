import express, { Request, Response } from 'express'; // import NextFunction where needed
import { Pool } from 'pg';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import config from '../config/default';

// Uncomment and import your route files
// import { errorHandler } from './src/middleware/errorHandler';

// Initialize express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize Postgres
const pool = new Pool({
  user: config.pgUser,
  host: config.pgHost,
  database: config.pgDatabase,
  password: config.pgPassword,
  port: config.pgPort,
});

pool.connect((err: Error) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Connected to the PostgreSQL database.');
  }
});

// Routes
// app.use('/api/users', userRoutes);
// app.use('/api/employees', employeeRoutes);

// Error handling middleware
// app.use(errorHandler);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running!' });
});

// Port setup
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});