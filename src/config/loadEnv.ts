import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(import.meta.dirname, '../../.env') });

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        console.error(`ENV ที่ขาดหาย: ${name}`);
        process.exit(1);
    }
    return value;          // ← ตรงนี้ TS narrow ให้เอง เพราะเช็คในฟังก์ชันเดียวกัน
}

export const DATABASE_URI = required('DATABASE_URI');
export const ACCESS_TOKEN_SECRET = required('ACCESS_TOKEN_SECRET');
export const REFRESH_TOKEN_SECRET = required('REFRESH_TOKEN_SECRET');
export const ALLOWED_ORIGINS = required('ALLOWED_ORIGINS').split(',');
// ไม่ใช้ required() เพราะตอน dev ไม่มี NODE_ENV ก็ถือว่าไม่ใช่ production
export const IS_PROD = process.env.NODE_ENV === 'production';
