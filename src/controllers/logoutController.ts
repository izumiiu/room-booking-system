import type { RequestHandler } from 'express';
import User from '../models/User.js';
import { clearCookieOptions } from '../config/cookieOptions.js';

const handleLogout: RequestHandler = async (req, res) => {
    const cookieToken: unknown = req.cookies?.jwt;

    // ไม่มี cookie ก็ถือว่าออกจากระบบแล้ว ตอบ 204 เหมือนกันทุกกรณี
    if (typeof cookieToken !== 'string') return res.sendStatus(204);

    const user = await User.findOne({ refreshToken: cookieToken }).select('+refreshToken').exec();
    if (user) {
        user.refreshToken = undefined;
        await user.save();
    }

    // ต้องใช้ option ชุดเดียวกับตอนตั้ง ไม่งั้น browser จะไม่ยอมลบ cookie ให้
    res.clearCookie('jwt', clearCookieOptions);
    return res.sendStatus(204);
};

export default handleLogout;
