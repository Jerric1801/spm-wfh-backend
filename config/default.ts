import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    sprint: number;
    pgUser?: string;
    pgHost?: string;
    pgDatabase?: string;
    pgPassword?: string;
    pgPort?: number;
}

const config: Config = {
    // The port on which the server will run
    port: Number(process.env.PORT) || 3000,

    // The current environment in which the application is running
    nodeEnv: process.env.NODE_ENV || 'development',

    sprint: Number(process.env.SPRINT) || 1,
    pgUser: process.env.DB_USER,
    pgHost: process.env.DB_HOST,
    pgDatabase: process.env.DB_NAME,
    pgPassword: process.env.DB_PASSWORD,
    pgPort: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
};

export default config;