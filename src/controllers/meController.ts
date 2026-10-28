import type { RequestHandler } from 'express';
import User from '../models/User.js';
import { requireUser } from '../utils/requestUser.js';
import { unauthorized } from '../utils/errors.js';

// GET /api/auth/me — frontend ใช้ตอนเปิดเว็บใหม่เพื่อรู้ว่ายังล็อกอินอยู่ไหม และเป็น role อะไร
export const getMe: RequestHandler = async (req, res) => {
    const auth = requireUser(req);
    const user = await User.findById(auth.userId).exec();
    if (!user) throw unauthorized('NO_USER', 'ไม่พบบัญชีผู้ใช้');

    res.json({ id: String(user._id), username: user.username, role: user.role });
};
