// ข้อผิดพลาดที่ "ตั้งใจให้เกิด" — ต่างจาก error ที่หลุดมาโดยไม่ได้คาด
// controller โยนตัวนี้ออกมา แล้ว errorHandler แปลงเป็น response ให้เอง
export class AppError extends Error {
    readonly status: number;
    readonly code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
    }
}

// message = ข้อความไทยที่เอาไปโชว์ผู้ใช้ได้เลย
// code    = รหัสอังกฤษให้ frontend เขียน if ได้โดยไม่ต้องเทียบข้อความไทย
export const badRequest   = (code: string, message: string) => new AppError(400, code, message);
export const unauthorized = (code: string, message: string) => new AppError(401, code, message);
export const forbidden    = (code: string, message: string) => new AppError(403, code, message);
export const notFound     = (code: string, message: string) => new AppError(404, code, message);
export const conflict     = (code: string, message: string) => new AppError(409, code, message);
