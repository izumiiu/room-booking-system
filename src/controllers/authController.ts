import bcrypt from 'bcrypt';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isValidUsername, isValidPassword } from '../utils/validators.js';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config/loadEnv.js';
import { refreshCookieOptions } from '../config/cookieOptions.js';

const handleLogin: RequestHandler = async (req, res) => {
    const { username, password } = req.body;

    // ข้อความเดียวกันทุกกรณี ไม่บอกว่า "ไม่มีผู้ใช้นี้" หรือ "รหัสผิด"
    // ไม่งั้นจะกลายเป็นเครื่องมือให้คนไล่เดาว่าบัญชีไหนมีอยู่จริง
    const deny = () => res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', code: 'BAD_CREDENTIALS' });

    if (!isValidUsername(username)) return deny();
    if (!isValidPassword(password)) return deny();

    const foundUser = await User.findOne({ username }).select('+password').exec();
    if (!foundUser) return deny();

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return deny();

    const accessToken = jwt.sign(
        { userId: foundUser._id, username: foundUser.username, role: foundUser.role },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '10m' }
    );

    const refreshToken = jwt.sign(
        { userId: foundUser._id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '24h' }
    );

    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    res.cookie('jwt', refreshToken, refreshCookieOptions);

    // ส่ง role กลับไปด้วย frontend จะได้รู้ว่าพาไปหน้าไหนโดยไม่ต้องแกะ token เอง
    res.json({
        accessToken,
        user: { id: String(foundUser._id), username: foundUser.username, role: foundUser.role }
    });
};

export default handleLogin;
