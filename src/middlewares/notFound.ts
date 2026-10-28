import type { RequestHandler } from 'express';

// ยิงมาที่ path ที่ไม่มี -> ตอบ JSON เหมือน error ตัวอื่น
// ไม่ปล่อยให้ Express ตอบหน้า HTML ซึ่ง frontend parse ไม่ได้
const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ message: 'ไม่พบเส้นทางนี้', code: 'NOT_FOUND' });
};

export default notFoundHandler;
