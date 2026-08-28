import 'dotenv/config';

export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export const OWNER_NAME = process.env.OWNER_NAME || 'Mess Owner';
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'owner@annpurna.host').toLowerCase();
export const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '';