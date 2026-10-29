import type { RequestHandler } from 'express';
import { buildAvailability } from '../services/slotService.js';
import { getDayStates } from '../services/dayService.js';
import { isValidDateString } from '../utils/validators.js';
import { badRequest } from '../utils/errors.js';
import { addDays } from '../utils/time.js';

// GET /api/availability?date=YYYY-MM-DD
export const getAvailability: RequestHandler = async (req, res) => {
    const { date } = req.query;
    if (!isValidDateString(date)) {
        throw badRequest('BAD_DATE', 'ต้องระบุวันที่ในรูปแบบ YYYY-MM-DD');
    }
    res.json(await buildAvailability(date));
};

// GET /api/availability/days?from=YYYY-MM-DD&to=YYYY-MM-DD
// เปิดสาธารณะเหมือน /availability — ใช้ระบายสีแถบเลือกวันในหน้าจอง
export const getDays: RequestHandler = async (req, res) => {
    const { from, to } = req.query;

    if (!isValidDateString(from) || !isValidDateString(to)) {
        throw badRequest('BAD_RANGE', 'ต้องระบุ from และ to ในรูปแบบ YYYY-MM-DD');
    }
    if (to < from) {
        throw badRequest('BAD_RANGE', 'วันสิ้นสุดต้องไม่มาก่อนวันเริ่มต้น');
    }
    // กันคนขอช่วงกว้างจนเป็นภาระกับฐานข้อมูล
    if (to > addDays(from, 365)) {
        throw badRequest('RANGE_TOO_WIDE', 'ขอข้อมูลได้ครั้งละไม่เกิน 1 ปี');
    }

    res.json({ days: await getDayStates(from, to) });
};
