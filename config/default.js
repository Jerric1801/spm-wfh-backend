require('dotenv').config();

module.exports = {
    // The port on which the server will run
    // It checks if a PORT variable is defined in the environment (.env file or system)
    // If not defined, it defaults to port 3000
    port: process.env.PORT || 3000,

    // The current environment in which the application is running
    // NODE_ENV is typically set to 'development', 'production', or 'test'
    // This helps differentiate between development and production behavior (e.g., logging, error handling)
    nodeEnv: process.env.NODE_ENV || 'development',

    sprint: process.env.SPRINT || 0,
    pgUser: process.env.DB_USER,
    pgHost: process.env.DB_HOST,
    pgDatabase: process.env.DB_NAME,
    pgPassword: process.env.DB_PASSWORD,
    pgPort: process.env.DB_PORT,
};