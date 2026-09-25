import 'dotenv/config';

export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export const OWNER_NAME = process.env.OWNER_NAME || 'Mess Owner';
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'owner@annpurna.host').toLowerCase();
export const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '';

// WhatsApp Cloud API (Meta) — invite messages
export const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
export const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
export const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || '';
export const WHATSAPP_COUNTRY_CODE = process.env.WHATSAPP_COUNTRY_CODE || '91';
// Link to the student app build, embedded as an invite template parameter.
export const APP_DOWNLOAD_URL = process.env.APP_DOWNLOAD_URL || '';