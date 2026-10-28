import './config/loadEnv.js';
import { IS_PROD } from './config/loadEnv.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { corsOptions } from './config/corsOptions.js';
import { logger } from './middlewares/logEvents.js';
import ensureBody from './middlewares/ensureBody.js';
import notFoundHandler from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// บน Render/Vercel มี reverse proxy คั่นหน้า server เสมอ
// ไม่บอก Express ไว้ req.protocol จะเป็น http ตลอด และ req.ip จะเป็น IP ของ proxy ไม่ใช่ของผู้ใช้
if (IS_PROD) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));

// จำกัดขนาด body — ไม่มี endpoint ไหนต้องการข้อมูลเกินนี้
// ปล่อยไว้ = ใครก็ยิง payload 100MB มากิน memory ได้
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(ensureBody);

app.use(cookieParser());
app.use(logger);

app.use('/api', apiRouter);

// สองตัวนี้ต้องอยู่ท้ายสุดและเรียงแบบนี้เท่านั้น
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
