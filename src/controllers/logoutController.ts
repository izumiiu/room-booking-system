import type { RequestHandler } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";


const handleLogout: RequestHandler = async (req, res) => {
    const cookies = req.cookies;
    if(!cookies?.jwt) return res.sendStatus(204);
    const cookieToken = cookies.jwt;

    try{
        const user = await User.findOne({ refreshToken: cookieToken }).exec();
        if(!user) {
            res.clearCookie('jwt', {httpOnly: true,          
            sameSite: 'none',        
            secure: true,
            });
            return res.sendStatus(204);
        }
        user.refreshToken = undefined;
        await user.save();
        res.clearCookie('jwt', {httpOnly: true, sameSite: 'none', secure: true});
        return res.sendStatus(204);
        


    }catch(err){
        // if(err instanceof mongoose.Error.CastError) return res.status(401).json({ message: `cast error` });
        if(err instanceof mongoose.Error.ValidationError) return res.status(500).json({ message: `type error` });

        console.error(err);
        return res.status(500).json({ message: `server error` });

    }

}

export default handleLogout;