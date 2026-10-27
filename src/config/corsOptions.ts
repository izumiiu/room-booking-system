import type { CorsOptions } from "cors";
import { ALLOWED_ORIGINS } from "./loadEnv.js";


const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // ไม่มี origin = ไม่ใช่ browser (Postman/curl) -> ปล่อยผ่านเพื่อความสะดวกตอน dev
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(null, false);   // ไม่ติดป้าย -> browser บล็อกเอง (ไม่ใช่ 500)
    },
    credentials: true,           // ให้ browser ส่ง httpOnly cookie ข้าม origin ได้
};

export { corsOptions };  
