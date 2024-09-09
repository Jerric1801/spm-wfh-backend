require('dotenv').config();

module.exports = {
    // The port on which the server will run
    // It checks if a PORT variable is defined in the environment (.env file or system)
    // If not defined, it defaults to port 5000
    port: process.env.PORT || 5000,

    // The current environment in which the application is running
    // NODE_ENV is typically set to 'development', 'production', or 'test'
    // This helps differentiate between development and production behavior (e.g., logging, error handling)
    nodeEnv: process.env.NODE_ENV || 'development',
};