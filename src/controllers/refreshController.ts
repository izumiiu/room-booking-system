import type { RequestHandler } from "express";
import  jwt  from "jsonwebtoken";
import User from "../models/User.js";
import { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } from "../config/loadEnv.js";
import mongoose from "mongoose";

interface RefreshPayload {
    userId : string
}

const isRefreshPayload = (u: unknown): u is RefreshPayload => {
    return typeof u === "object" && u !== null && 'userId' in u && typeof u.userId === 'string';
}

const handleRefresh: RequestHandler = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.status(401).json({ message: `no token` });
    const cookieToken = cookies.jwt;
    try{
        const decoded = jwt.verify(cookieToken, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
        if(!isRefreshPayload(decoded)) return res.status(401).json({ message: 'Invalid type' })
        const user = await User.findById(decoded.userId).select('+refreshToken').exec();
        if(!user) return res.status(401).json({ message: `user not found`});
        if(user.refreshToken !== cookieToken) return res.status(401).json({ message: `wrong token` });
        const accessToken = jwt.sign(
                    {
                        userId: user._id,
                        username: user.username,
                        role: user.role
                    },
                    ACCESS_TOKEN_SECRET,
                    { expiresIn: '10m' }
                );
        return res.json({ accessToken });

    }catch(err){
        if(err instanceof mongoose.Error.CastError) return res.status(401).json({ message: `Cast error` });

        if(err instanceof jwt.TokenExpiredError) return res.status(401).json({ message: `Expired token`});
        if(err instanceof jwt.JsonWebTokenError) return res.status(401).json({ message: `token error`});
        console.error(err);
        return res.status(500).json({ message: `server error` });
    }

}

export default handleRefresh;