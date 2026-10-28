import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import type { QueryFilter, UpdateQuery } from 'mongoose';
import Booking from '../models/Booking.js';
import type { IBooking } from '../models/Booking.js';
import DayOverride from '../models/DayOverride.js';
import type { IDayOverride, DayOverrideDoc } from '../models/DayOverride.js';
import { cancelBookingDoc, toBookingView } from '../services/bookingService.js';
import { requireUser } from '../utils/requestUser.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import {
    isValidDateString, isNonEmptyString, isValidBookingStatus, escapeRegex, toPositiveInt
} from '../utils/validators.js';
import { todayTH } from '../utils/time.js';

const toDayOverrideView = (d: DayOverrideDoc) => ({
    date: d.date,
    isOpen: d.isOpen,
    note: d.note ?? null,
    updatedAt: d.updatedAt ?? null
});

// GET /api/admin/bookings?from&to&q&status&page&limit
export const listAllBookings: RequestHandler = async (req, res) => {
    const { from, to, q, status, page, limit } = req.query;
    const filter: QueryFilter<IBooking> = {};

    // ★ ทุกค่าจาก query ต้องตรวจชนิดก่อนใช้
    //   ถ้ายัดลง filter ดิบ ๆ ผู้ใช้ส่ง ?status[$ne]=x มาเพื่อดึงข้อมูลเกินสิทธิ์ได้ (NoSQL injection)
    if (from !== undefined || to !== undefined) {
        const range: { $gte?: string; $lte?: string } = {};
        if (from !== undefined) {
            if (!isValidDateString(from)) throw badRequest('BAD_FROM', 'วันที่เริ่มต้นไม่ถูกต้อง');
            range.$gte = from;
        }
        if (to !== undefined) {
            if (!isValidDateString(to)) throw badRequest('BAD_TO', 'วันที่สิ้นสุดไม่ถูกต้อง');
            range.$lte = to;
        }
        filter.date = range;
    }

    if (status !== undefined) {
        if (!isValidBookingStatus(status)) throw badRequest('BAD_STATUS', 'สถานะไม่ถูกต้อง');
        filter.status = status;
    }

    if (q !== undefined) {
        if (typeof q !== 'string' || q.length > 100) throw badRequest('BAD_QUERY', 'คำค้นไม่ถูกต้อง');
        const safe = escapeRegex(q.trim());   // กัน regex ที่ผู้ใช้ส่งมาทำ server ค้าง
        if (safe) {
            filter.$or = [
                { fullName:   { $regex: safe, $options: 'i' } },
                { topic:      { $regex: safe, $options: 'i' } },
                { department: { $regex: safe, $options: 'i' } },
                { email:      { $regex: safe, $options: 'i' } }
            ];
        }
    }

    // แบ่งหน้าเสมอ ไม่เปิดให้ดึงทั้ง collection ในคำขอเดียว
    const pageNum = toPositiveInt(page, 1);
    const limitNum = Math.min(toPositiveInt(limit, 20), 100);

    const [items, total] = await Promise.all([
        Booking.find(filter)
            .sort({ date: -1, startSlot: -1 })   // ใหม่สุดก่อน ตามที่ออกแบบหน้า dashboard ไว้
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .exec(),
        Booking.countDocuments(filter).exec()
    ]);

    res.json({
        bookings: items.map(toBookingView),
        total,
        page: pageNum,
        limit: limitNum
    });
};

// POST /api/admin/bookings/:id/cancel
export const cancelAnyBooking: RequestHandler = async (req, res) => {
    const auth = requireUser(req);
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) throw badRequest('BAD_ID', 'รหัสการจองไม่ถูกต้อง');
    if (!isNonEmptyString(reason, 300)) throw badRequest('BAD_REASON', 'กรุณาระบุเหตุผลการยกเลิก');

    const booking = await Booking.findById(id).exec();
    if (!booking) throw notFound('NOT_FOUND', 'ไม่พบการจองนี้');

    await cancelBookingDoc(booking, auth.userId, { reason: reason.trim(), allowStarted: true });
    res.json(toBookingView(booking));
};

// GET /api/admin/day-overrides?from&to
export const listDayOverrides: RequestHandler = async (req, res) => {
    const { from, to } = req.query;
    const filter: QueryFilter<IDayOverride> = {};

    if (from !== undefined || to !== undefined) {
        const range: { $gte?: string; $lte?: string } = {};
        if (from !== undefined) {
            if (!isValidDateString(from)) throw badRequest('BAD_FROM', 'วันที่เริ่มต้นไม่ถูกต้อง');
            range.$gte = from;
        }
        if (to !== undefined) {
            if (!isValidDateString(to)) throw badRequest('BAD_TO', 'วันที่สิ้นสุดไม่ถูกต้อง');
            range.$lte = to;
        }
        filter.date = range;
    }

    const docs = await DayOverride.find(filter).sort({ date: 1 }).limit(400).exec();
    res.json({ overrides: docs.map(toDayOverrideView) });
};

// POST /api/admin/day-overrides   { date, isOpen, note? }
export const setDayOverride: RequestHandler = async (req, res) => {
    const auth = requireUser(req);
    const { date, isOpen, note } = req.body;

    if (!isValidDateString(date)) throw badRequest('BAD_DATE', 'รูปแบบวันที่ไม่ถูกต้อง');
    if (typeof isOpen !== 'boolean') throw badRequest('BAD_IS_OPEN', 'ต้องระบุว่าเปิดหรือปิด');
    if (note !== undefined && !isNonEmptyString(note, 200)) throw badRequest('BAD_NOTE', 'หมายเหตุยาวเกินกำหนด');
    if (date < todayTH()) throw badRequest('PAST_DATE', 'แก้ไขวันที่ผ่านมาแล้วไม่ได้');

    // ปิดวันที่ยังมีคนจองค้างอยู่ = ทิ้งผู้ใช้ไว้กลางทาง ให้ยกเลิกรายการเหล่านั้นก่อน
    if (!isOpen) {
        const existing = await Booking.countDocuments({ date, status: 'booked' }).exec();
        if (existing > 0) {
            throw conflict('HAS_BOOKINGS', `วันนี้มีการจองค้างอยู่ ${existing} รายการ กรุณายกเลิกก่อนปิดห้อง`);
        }
    }

    const set: Record<string, unknown> = { date, isOpen, createdBy: auth.userId };
    if (note) set.note = note.trim();
    const update: UpdateQuery<IDayOverride> = note ? { $set: set } : { $set: set, $unset: { note: 1 } };

    // upsert = มีอยู่แล้วก็ทับ ไม่มีก็สร้าง จบในคำสั่งเดียว กันสองแถวที่ขัดกันเอง
    const doc = await DayOverride.findOneAndUpdate({ date }, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    }).exec();

    if (!doc) throw notFound('NOT_FOUND', 'บันทึกไม่สำเร็จ');
    res.json(toDayOverrideView(doc));
};

// DELETE /api/admin/day-overrides/:date  — กลับไปใช้กฎปกติของวันนั้น
export const removeDayOverride: RequestHandler = async (req, res) => {
    const { date } = req.params;
    if (!isValidDateString(date)) throw badRequest('BAD_DATE', 'รูปแบบวันที่ไม่ถูกต้อง');

    await DayOverride.deleteOne({ date }).exec();
    res.status(204).end();
};
