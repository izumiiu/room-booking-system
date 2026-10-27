import type { RequestHandler } from "express";

// express.json() ไม่เติม req.body ถ้า request ไม่มี Content-Type
// ปล่อยไว้ -> destructure จาก undefined จะ throw -> ได้ 500 แทนที่จะเป็น 400

const ensureBody: RequestHandler = (req, _res, next) => {
    if(typeof req.body === 'undefined'){
        req.body = {};
    }
    next();
} 

export default ensureBody;