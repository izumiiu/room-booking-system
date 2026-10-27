import bcrypt from 'bcrypt';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isValidUsername, isValidPassword } from '../utils/validators.js';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config/loadEnv.js';

const handleLogin: RequestHandler = async (req, res) => {
    const { username, password } = req.body;
    if(!isValidUsername(username)) return res.status(401).json({ message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง`})
    if(!isValidPassword(password)) return res.status(401).json({ message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง`})

    try{
        const foundUser = await User.findOne({ username: username }).select('+password').exec();
        if(!foundUser) return res.status(401).json({ message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง`});
        const match = await bcrypt.compare(password, foundUser.password);
        if(!match){
            return res.status(401).json({ message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง` })
        }
        const accessToken = jwt.sign(
            {
                userId: foundUser._id,
                username: foundUser.username,
                role: foundUser.role
            },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '10m' }
        );

        const refreshToken = jwt.sign(
            {
                userId: foundUser._id,
            },
            REFRESH_TOKEN_SECRET,
            { expiresIn: '24h' }
        );
        foundUser.refreshToken = refreshToken;
        await foundUser.save();

        res.cookie('jwt', refreshToken, {
            httpOnly: true,          // JS ในหน้าเว็บอ่านไม่ได้ กัน XSS ขโมย token
            sameSite: 'none',        // ยอมให้ส่งข้ามโดเมน (React คนละ port)
            secure: true,            // ส่งเฉพาะ https  ← ดูหมายเหตุข้างล่าง
            maxAge: 24 * 60 * 60 * 1000
            });
        res.json({ accessToken });


    }catch(err){
        console.error(err);
        return res.status(500).json({ message: `server error` });
    }
    
}

export default handleLogin;