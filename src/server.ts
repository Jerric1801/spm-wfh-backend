import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import config from '../config/default'

// Import service routes
import viewScheduleRoutes from './services/viewSchedule/viewScheduleRoutes';
import manageRequestRoutes from './services/manageRequest/manageRequestRoutes';
import authRoutes from './services/auth/authRoutes'
import applyWFHRoutes from './services/applyWFH/applyWFHRoutes';

const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);

// Register routes for each service
app.use('/api/view-schedule', viewScheduleRoutes);
app.use('/api/apply-WFH', applyWFHRoutes);

//Register routes for each serivces
app.use('/api/manage-request', manageRequestRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache'); 
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');   
    res.status(200).json({ status: 'ok', message: 'Server is running!' });
});

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Internal Server Error' });
// });

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

export default app;
