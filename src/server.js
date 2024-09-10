const express = require('express');
const { Pool } = require('pg')
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const config = require('../config/default')

// const userRoutes = require('./src/services/users/userRoutes');
// const employeeRoutes = require('./src/services/employees/employeeRoutes');
// const { errorHandler } = require('./src/middleware/errorHandler');

// Initialize express
const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(morgan('dev')); // Log requests to the console


// Initialize Postgres
const pool = new Pool({
  user: config.pgUser,
  host: config.pgHost,
  database: config.pgDatabase,
  password: config.pgPassword,
  port: config.pgPort,
});
pool.connect((err) => {
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

// Port setup
const PORT = config.port;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});