const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const config = require('../config/default')

// const userRoutes = require('./src/features/users/userRoutes');
// const employeeRoutes = require('./src/features/employees/employeeRoutes');
// const { errorHandler } = require('./src/middleware/errorHandler');

// Initialize express
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(morgan('dev')); // Log requests to the console

// Feature-based routes
// app.use('/api/users', userRoutes);
// app.use('/api/employees', employeeRoutes);

// Error handling middleware
// app.use(errorHandler);

// Port setup
const PORT = config.port;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});