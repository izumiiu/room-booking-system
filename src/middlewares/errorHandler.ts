import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';

const isDuplicateKey = (err: unknown): boolean =>
    typeof err === 'object' && err !== null && 'code' in err &&
    (err as { code?: unknown }).code === 11000;

// ★ ต้องมีพารามิเตอร์ครบ 4 ตัว Express ดูจากจำนวนพารามิเตอร์ว่านี่คือ error handler
//   เขียน 3 ตัวเมื่อไหร่ มันจะกลายเป็น middleware ธรรมดาที่ไม่มีวันถูกเรียก
//
// Express 5 ส่ง promise ที่ reject จาก async handler มาที่นี่ให้อัตโนมัติ
// controller จึงไม่ต้องมี try/catch เลย
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        res.status(err.status).json({ message: err.message, code: err.code });
        return;
    }

    if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
            message: 'ข้อมูลไม่ถูกต้อง',
            code: 'VALIDATION',
            fields: Object.keys(err.errors)
        });
        return;
    }

    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง', code: 'BAD_ID' });
        return;
    }

    if (isDuplicateKey(err)) {
        res.status(409).json({ message: 'ข้อมูลซ้ำกับที่มีอยู่แล้ว', code: 'DUPLICATE' });
        return;
    }

    // อะไรที่นึกไม่ถึง: log ไว้ให้เราดู แต่ไม่ส่งรายละเอียดออกไป
    // ข้อความ error ของระบบมักมีชื่อ collection / path / เวอร์ชันไลบรารีติดไปด้วย
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', code: 'INTERNAL' });
};

export default errorHandler;
