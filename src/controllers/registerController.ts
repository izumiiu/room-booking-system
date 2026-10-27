import type { RequestHandler } from "express";
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import mongoose from "mongoose";
import { isValidUsername, isValidPassword } from "../utils/validators.js";

const handleNewUser: RequestHandler = async (req, res) => {
    const { username, password } = req.body;
    // if (!username || !password) return res.status(400).json({ 'message': "Username and password are required,"});

    if(!isValidUsername(username)){
        return res.status(400).json({ message: `ชื่อต้องมีอย่างน้อย 3 ตัวอักษร และห้ามมีช่องว่าง`})
    }
    if(!isValidPassword(password)){
        return res.status(400).json({ message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว และห้ามมีช่องว่าง' })
    }

    try{
        // check for duplicate username in the db
        const duplicate = await User.findOne({ username: username }).exec();
        if(duplicate) return res.status(409).json({ message: `ผู้ใช้นี้ถูกใช้แล้ว`})

        //encrypt the password
        const hashedPwd = await bcrypt.hash(password, 10);

        //create and store the new user
        await User.create({ 
            "username": username, 
            "password": hashedPwd  
        });
        
        res.status(201).json({ 'success': `New user ${username} created!` }); 

    } catch (err) {
        if(err instanceof mongoose.Error.ValidationError){
            return res.status(400).json({ 
                message: 'ข้อมูลไม่ถูกต้อง',
                fields: Object.keys(err.errors)})
        }
        if (err && typeof err === 'object' && 'code' in err && err.code === 11000){
            return res.status(409).json({ message: 'ผู้ใช้นี้ถูกใช้แล้ว' });
        }
        console.error(err);                                    //ทุกอย่างที่นึกไม่ถึง
        return res.status(500).json({ message: 'server error' });

    }
}

export default handleNewUser;

