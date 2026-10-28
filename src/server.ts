import mongoose from 'mongoose';
import connectDB from './config/dbConn.js';
import app from './app.js';
import { ALLOWED_ORIGINS, IS_PROD } from './config/loadEnv.js';

const PORT = process.env.PORT || 3500;

connectDB();


// พิมพ์ไว้ตั้งแต่ต้น เวลาขึ้น production แล้ว cookie ไม่ทำงานจะได้เช็คจาก log ได้ทันที
// ว่า NODE_ENV มาถึงจริงไหม และ origin ที่อนุญาตตรงกับ URL ของ frontend หรือเปล่า
console.log(`[config] NODE_ENV=${process.env.NODE_ENV ?? '(ไม่ได้ตั้ง)'}`);
console.log(`[config] cookie: secure=${IS_PROD} sameSite=${IS_PROD ? 'none' : 'lax'}`);
console.log(`[config] allowed origins: ${ALLOWED_ORIGINS.join(' , ')}`);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {console.log(`server running on port ${PORT}`)});   // ย้าย listen เข้ามาไว้ในนี้
});

