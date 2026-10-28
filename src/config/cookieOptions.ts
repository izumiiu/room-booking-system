import type { CookieOptions } from 'express';
import { IS_PROD } from './loadEnv.js';

// ★ จุดที่โปรเจคก่อนหน้านี้พัง: secure: true แปลว่า "ส่งเฉพาะ https"
// ตอน dev หน้าเว็บรันบน http://localhost -> browser จะไม่เก็บ cookie เลย
// และ refresh จะล้มเหลวทุกครั้งโดยไม่มี error อะไรให้เห็น
//
// sameSite:
//   dev  -> 'lax'  : localhost:5173 กับ localhost:3500 ถือเป็น site เดียวกัน (port ไม่นับ) จึงส่งได้
//   prod -> 'none' : frontend กับ backend อยู่คนละโดเมน ต้อง none + secure เท่านั้น
const base: CookieOptions = {
    httpOnly: true,                        // JS ในหน้าเว็บอ่านไม่ได้ กัน XSS ขโมย token
    sameSite: IS_PROD ? 'none' : 'lax',
    secure: IS_PROD,
    path: '/'
};

export const refreshCookieOptions: CookieOptions = {
    ...base,
    maxAge: 24 * 60 * 60 * 1000
};

// clearCookie ต้องใช้ option ชุดเดียวกับตอนตั้ง ไม่งั้น browser จะไม่ยอมลบให้
export const clearCookieOptions: CookieOptions = base;
