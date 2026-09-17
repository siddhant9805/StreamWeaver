import 'dotenv/config';
const required = ['MONGODB_URI', 'JWT_SECRET'];
export function getEnv() { const missing = required.filter(key => !process.env[key]); if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`); return { port: Number(process.env.PORT || 4000), mongoUri: process.env.MONGODB_URI, jwtSecret: process.env.JWT_SECRET, clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', uploadDir: process.env.UPLOAD_DIR || 'uploads', logDir: process.env.LOG_DIR || 'logs' }; }
