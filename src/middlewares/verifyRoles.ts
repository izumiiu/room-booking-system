import type { RequestHandler } from "express";

const verifyRoles = (...allowedRoles: ('normalUser' | 'admin')[]): RequestHandler => {
    //                  ↑ rest: รวบทุก argument ที่ส่งมาเป็น array
    return (req, res, next) => {
        if(!req.user) {
            console.error('verifyRoles ถูกเรียกโดยไม่มี verifyJWT นำหน้า');
            return res.status(500).json({ message: `server error` });
        }
        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({ message: 'role ไม่ผ่าน'});
        }
        next();

    }
}

export default verifyRoles;