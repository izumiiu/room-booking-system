
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
import { ACCESS_TOKEN_SECRET } from "../config/loadEnv.js";

interface AccessPayload{
    userId: string,
    username: string,
    role: 'normalUser' | 'admin'
}


export const isAccessPayload = (a: unknown): a is AccessPayload => {
    return typeof a === 'object' && a !== null && 'userId' in a && 'username' in a && 'role' in a 
                                                                                   && typeof a.userId === 'string'
                                                                                   && typeof a.username === 'string'
                                                                                   && (a.role === 'normalUser' || a.role === 'admin')
}



const verifyJWT: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: `dont have authHeader` });
    const token = authHeader.split(' ')[1];
    if(!token) return res.status(401).json({ message: `Invalid type authHeader` });

    let decoded: string | JwtPayload;

    try{
        decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    }catch(err){
        if(err instanceof jwt.TokenExpiredError) return res.status(401).json({ message: `expired token` });
        if(err instanceof jwt.JsonWebTokenError) return res.status(401).json({ message: `token ไม่ถูกต้อง` });
        console.error(err);
        return res.status(500).json({ message: `server error` })
    }
    
    // try ครอบแค่ jwt.verify เพราะเป็นบรรทัดเดียวที่ throw ได้
    if(!isAccessPayload(decoded)) return res.status(401).json({ message: `invalid AccessPayload` });
    req.user = { userId: decoded.userId, username: decoded.username, role: decoded.role }
    next();
}

export default verifyJWT;