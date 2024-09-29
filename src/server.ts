import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';

// Import service routes
import viewScheduleRoutes from './viewSchedule/routes/requestRoutes';


const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Register routes for each service
app.use('/services/view-schedule', viewScheduleRoutes);
// Register more routes as more services are added
// app.use('/api/manage-employee', manageEmployeeRoutes);
// app.use('/api/attendance-tracking', attendanceTrackingRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running!' });
});

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Internal Server Error' });
// });

export default app;
