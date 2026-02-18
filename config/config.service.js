import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;

const envPath = {
  development: `.env.development`,
  production: `.env.production`,
};
console.log({ en: envPath[NODE_ENV] });

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) });

export const port = process.env.PORT ?? 7000;

export const DB_URI = process.env.DB_URI;
export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
// jwt
export const JWT_EXPIRE_IN = process.env.JWT_EXPIRE_IN;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// SEND EMAIL


export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
console.log({ SALT_ROUND });
