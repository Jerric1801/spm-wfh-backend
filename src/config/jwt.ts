import dotenv from 'dotenv';

dotenv.config();

interface JwtConfig {
    secretKey: string;
    expiresIn: string;
}

const jwtConfig: JwtConfig = {
    secretKey: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '1h',
};

export default jwtConfig;
