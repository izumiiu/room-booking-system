import type { Request } from 'express';
import { unauthorized } from './errors.js';

export interface AuthUser {
    userId: string;
    username: string;
    role: 'normalUser' | 'admin';
}

// req.user เป็น optional ในระดับ type เพราะ route สาธารณะก็ใช้ Request ตัวเดียวกัน
// ตัวนี้แปลง optional เป็นค่าที่ใช้ได้จริง และกันกรณีลืมใส่ verifyJWT หน้า route
export const requireUser = (req: Request): AuthUser => {
    if (!req.user) throw unauthorized('NO_AUTH', 'กรุณาเข้าสู่ระบบ');
    return req.user;
};
