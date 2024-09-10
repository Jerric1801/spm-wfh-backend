const path = require('path');
const config = require('./default');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: config.pgHost,
      user: config.pgUser,
      password: config.pgPassword,
      database: config.pgDatabase,
      port: config.pgPort,
    },
    migrations: {
      directory: path.join(__dirname, '..', 'migrations', `sprint${config.sprint}`), 
    },
    seeds: {
      directory: path.join(__dirname, '..', 'seeders'), 
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: config.pgHost,
      user: config.pgUser,
      password: config.pgPassword,
      database: config.pgDatabase,
      port: config.pgPort,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: path.join(__dirname, '..', 'migrations', `sprint${config.sprint}`), 
    },
    seeds: {
      directory: path.join(__dirname, '..', 'seeders'), 
    },
  },
};