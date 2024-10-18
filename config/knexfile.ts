import path from 'path';
import config from './default';

interface DatabaseConfig {
    client: string;
    connection: {
        host: string | undefined;
        user: string | undefined;
        password: string | undefined;
        database: string | undefined;
        port?: number;
        ssl?: {
            rejectUnauthorized: boolean;
        };
    };
    migrations: {
        directory: string;
    };
    seeds: {
        directory: string;
    };
}

const development: DatabaseConfig = {
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
        directory: path.join(__dirname, '..', 'seeders', `sprint${config.sprint}`),
    },
};

const production: DatabaseConfig = {
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
        directory: path.join(__dirname, '..', 'seeders', `sprint${config.sprint}`),
    },
};

export default {
    development,
    production,
};
