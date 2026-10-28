import type { RequestHandler } from 'express';
import { buildAvailability } from '../services/slotService.js';
import { isValidDateString } from '../utils/validators.js';
import { badRequest } from '../utils/errors.js';

// GET /api/availability?date=YYYY-MM-DD
export const getAvailability: RequestHandler = async (req, res) => {
    const { date } = req.query;
    if (!isValidDateString(date)) {
        throw badRequest('BAD_DATE', 'ต้องระบุวันที่ในรูปแบบ YYYY-MM-DD');
    }
    res.json(await buildAvailability(date));
};
