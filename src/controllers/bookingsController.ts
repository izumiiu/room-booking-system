import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import {
    createBookingWithLocks,
    cancelBookingDoc,
    countActiveBookings,
    toBookingView
} from '../services/bookingService.js';
import { isDayOpen } from '../services/dayService.js';
import { requireUser } from '../utils/requestUser.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import {
    isValidDateString, isNonEmptyString, isValidAttendees, isValidPhone, isValidEmail
} from '../utils/validators.js';
import { isValidSlot, slotStart, MAX_ACTIVE_BOOKINGS, MAX_ADVANCE_DAYS } from '../utils/slot.js';
import { todayTH, nowMinutesTH, addDays } from '../utils/time.js';

// POST /api/bookings
export const createBooking: RequestHandler = async (req, res) => {
    const auth = requireUser(req);

    // ★ หยิบทีละ field ด้วยมือ ไม่ส่ง req.body เข้า Model ตรง ๆ
    //   ไม่งั้นผู้ใช้แนบ status: 'cancelled' หรือ user: <id คนอื่น> มาได้ (mass assignment)
    const { date, startSlot, endSlot, topic, purpose, attendees, fullName, department, phone, email } = req.body;

    // ---------- 1. รูปแบบข้อมูล ----------
    if (!isValidDateString(date))        throw badRequest('BAD_DATE', 'รูปแบบวันที่ไม่ถูกต้อง');
    if (!isValidSlot(startSlot) || !isValidSlot(endSlot))
                                         throw badRequest('BAD_SLOT', 'ช่วงเวลาที่เลือกไม่ถูกต้อง');
    if (startSlot > endSlot)             throw badRequest('BAD_RANGE', 'เวลาเริ่มต้องมาก่อนเวลาสิ้นสุด');
    if (!isNonEmptyString(topic, 200))   throw badRequest('BAD_TOPIC', 'กรุณาระบุหัวข้อการประชุม');
    if (!isValidAttendees(attendees))    throw badRequest('BAD_ATTENDEES', 'กรุณาระบุจำนวนผู้เข้าร่วม');
    if (!isNonEmptyString(fullName, 120))throw badRequest('BAD_NAME', 'กรุณาระบุชื่อ-นามสกุล');
    if (!isValidPhone(phone))            throw badRequest('BAD_PHONE', 'เบอร์โทรศัพท์ไม่ถูกต้อง');
    if (!isValidEmail(email))            throw badRequest('BAD_EMAIL', 'อีเมลไม่ถูกต้อง');
    if (purpose !== undefined && !isNonEmptyString(purpose, 500))
                                         throw badRequest('BAD_PURPOSE', 'วัตถุประสงค์ยาวเกินกำหนด');
    if (department !== undefined && !isNonEmptyString(department, 120))
                                         throw badRequest('BAD_DEPARTMENT', 'หน่วยงานไม่ถูกต้อง');

    // ---------- 2. กฎการจอง ----------
    const today = todayTH();
    if (date < today) throw badRequest('PAST_DATE', 'ไม่สามารถจองย้อนหลังได้');
    if (date > addDays(today, MAX_ADVANCE_DAYS - 1))
        throw badRequest('TOO_FAR', `จองล่วงหน้าได้ไม่เกิน ${MAX_ADVANCE_DAYS} วัน`);

    if (!(await isDayOpen(date)))
        throw conflict('DAY_CLOSED', 'วันดังกล่าวปิดให้บริการ');

    if (date === today && nowMinutesTH() >= slotStart(startSlot))
        throw badRequest('PAST_SLOT', 'ช่วงเวลาที่เลือกผ่านไปแล้ว');

    if (await countActiveBookings(auth.userId) >= MAX_ACTIVE_BOOKINGS)
        throw conflict('QUOTA_FULL', `จองค้างไว้ได้ไม่เกิน ${MAX_ACTIVE_BOOKINGS} รายการ`);

    // ---------- 3. เขียนจริง ----------
    // ไม่เช็คว่าช่องว่างไหม — ปล่อยให้ unique index ตัดสิน (ดู bookingService)
    const booking = await createBookingWithLocks({
        user: new mongoose.Types.ObjectId(auth.userId),
        date,
        startSlot,
        endSlot,
        topic: topic.trim(),
        attendees,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        ...(purpose ? { purpose: purpose.trim() } : {}),
        ...(department ? { department: department.trim() } : {})
    });

    res.status(201).json(toBookingView(booking));
};

// GET /api/bookings/me
export const getMyBookings: RequestHandler = async (req, res) => {
    const auth = requireUser(req);

    const bookings = await Booking.find({ user: auth.userId })
        .sort({ date: -1, startSlot: -1 })
        .limit(200)
        .exec();

    res.json({
        bookings: bookings.map(toBookingView),
        quota: {
            max: MAX_ACTIVE_BOOKINGS,
            used: await countActiveBookings(auth.userId)
        }
    });
};

// GET /api/bookings/:id
export const getBookingById: RequestHandler = async (req, res) => {
    const auth = requireUser(req);
    const { id } = req.params;

    // เช็ครูปแบบก่อนยิง DB ไม่งั้น id มั่ว ๆ จะกลายเป็น CastError -> 500 แทนที่จะเป็น 400
    if (!mongoose.isValidObjectId(id)) throw badRequest('BAD_ID', 'รหัสการจองไม่ถูกต้อง');

    const booking = await Booking.findById(id).exec();
    if (!booking) throw notFound('NOT_FOUND', 'ไม่พบการจองนี้');

    // ★ กัน IDOR: รู้ id ของคนอื่นแล้วเปิดดูข้อมูลติดต่อเขาไม่ได้
    if (auth.role !== 'admin' && String(booking.user) !== auth.userId) {
        throw forbidden('NOT_OWNER', 'ไม่มีสิทธิ์ดูการจองนี้');
    }

    res.json(toBookingView(booking));
};

// POST /api/bookings/:id/cancel
export const cancelBooking: RequestHandler = async (req, res) => {
    const auth = requireUser(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) throw badRequest('BAD_ID', 'รหัสการจองไม่ถูกต้อง');

    const booking = await Booking.findById(id).exec();
    if (!booking) throw notFound('NOT_FOUND', 'ไม่พบการจองนี้');

    // เส้นนี้สำหรับผู้ใช้ยกเลิกของตัวเองเท่านั้น admin มีเส้นของตัวเองที่บังคับให้ใส่เหตุผล
    if (String(booking.user) !== auth.userId) {
        throw forbidden('NOT_OWNER', 'ยกเลิกได้เฉพาะการจองของตัวเอง');
    }

    await cancelBookingDoc(booking, auth.userId);
    res.json(toBookingView(booking));
};
