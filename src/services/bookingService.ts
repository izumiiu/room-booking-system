import mongoose from 'mongoose';
import type { Types } from 'mongoose';
import Booking from '../models/Booking.js';
import type { BookingDoc } from '../models/Booking.js';
import SlotLock from '../models/SlotLock.js';
import { conflict } from '../utils/errors.js';
import { OPEN_MIN, SLOT_MIN, slotStart, slotEnd, toHHMM } from '../utils/slot.js';
import { todayTH, nowMinutesTH } from '../utils/time.js';

export interface CreateBookingInput {
    user: Types.ObjectId;
    date: string;
    startSlot: number;
    endSlot: number;
    topic: string;
    purpose?: string;
    attendees: number;
    fullName: string;
    department?: string;
    phone: string;
    email: string;
}

const isDuplicateKey = (err: unknown): boolean =>
    typeof err === 'object' && err !== null && 'code' in err &&
    (err as { code?: unknown }).code === 11000;

/**
 * ★ หัวใจของการกันจองซ้อน
 *
 * สังเกตว่าไม่มีการเช็คว่า "ช่องว่างไหม" เลยสักบรรทัด เพราะเช็คแล้วก็ไม่ปลอดภัย —
 * ระหว่างบรรทัดที่เช็คกับบรรทัดที่เขียน คนอื่นแทรกเข้ามาได้ (race condition)
 *
 * เราเขียนลงไปเลยแล้วให้ unique index ของ SlotLock เป็นคนปฏิเสธ
 * ซึ่งเป็นปฏิบัติการที่แทรกกลางไม่ได้ คนที่สองจะได้ error 11000 เสมอ
 */
export const createBookingWithLocks = async (input: CreateBookingInput): Promise<BookingDoc> => {
    const booking = await Booking.create(input);

    const locks = [];
    for (let s = input.startSlot; s <= input.endSlot; s++) {
        locks.push({ date: input.date, slot: s, booking: booking._id });
    }

    try {
        // ordered: true = เจอตัวแรกที่ซ้ำแล้วหยุดทันที ไม่พยายามใส่ตัวที่เหลือ
        await SlotLock.insertMany(locks, { ordered: true });
    } catch (err) {
        // ล้มเหลว -> เก็บกวาดให้หมด ไม่ทิ้ง booking ค้างที่ไม่มี lock
        await SlotLock.deleteMany({ booking: booking._id }).exec();
        await booking.deleteOne();

        if (isDuplicateKey(err)) {
            throw conflict('SLOT_TAKEN', 'ช่วงเวลานี้เพิ่งถูกจองไป กรุณาเลือกช่วงใหม่');
        }
        throw err;
    }

    return booking;
};

export const releaseLocks = async (bookingId: Types.ObjectId): Promise<void> => {
    await SlotLock.deleteMany({ booking: bookingId }).exec();
};

/** นับเฉพาะการจองที่ "ยังมาไม่ถึง" ตามกติกาโควต้า 3 รายการ */
export const countActiveBookings = async (userId: string): Promise<number> => {
    const today = todayTH();
    // สล็อตที่เริ่มไปแล้ว ณ ตอนนี้ — ช่องที่กำลังใช้งานอยู่ถือว่าเริ่มแล้ว ไม่นับเป็นโควต้าค้าง
    const startedSlot = Math.floor((nowMinutesTH() - OPEN_MIN) / SLOT_MIN);

    return Booking.countDocuments({
        user: userId,
        status: 'booked',
        $or: [
            { date: { $gt: today } },
            { date: today, startSlot: { $gt: startedSlot } }
        ]
    }).exec();
};

interface CancelOptions {
    reason?: string;
    allowStarted?: boolean;   // admin ยกเลิกย้อนหลังได้ ผู้ใช้ทั่วไปไม่ได้
}

export const cancelBookingDoc = async (
    booking: BookingDoc,
    byUserId: string,
    options: CancelOptions = {}
): Promise<BookingDoc> => {
    if (booking.status === 'cancelled') {
        throw conflict('ALREADY_CANCELLED', 'การจองนี้ถูกยกเลิกไปแล้ว');
    }

    if (!options.allowStarted) {
        const today = todayTH();
        const started =
            booking.date < today ||
            (booking.date === today && nowMinutesTH() >= slotStart(booking.startSlot));
        if (started) {
            throw conflict('ALREADY_STARTED', 'เลยเวลาเริ่มใช้งานแล้ว ยกเลิกไม่ได้');
        }
    }

    booking.status = 'cancelled';
    booking.cancelledBy = new mongoose.Types.ObjectId(byUserId);
    booking.cancelledAt = new Date();
    if (options.reason) booking.cancelReason = options.reason;
    await booking.save();

    // Booking เก็บไว้เป็นประวัติ แต่ SlotLock ต้องลบจริง ไม่งั้นช่องจะไม่คืนให้คนอื่น
    await releaseLocks(booking._id);

    return booking;
};

/**
 * แปลงเอกสารเป็นรูปร่างที่ส่งออกไปข้างนอก
 * ห้ามส่ง document ดิบ ๆ เพราะวันหนึ่งที่เพิ่ม field ภายในเข้ามา มันจะหลุดออกไปเองโดยไม่มีใครรู้
 */
export const toBookingView = (b: BookingDoc) => ({
    id: String(b._id),
    date: b.date,
    startSlot: b.startSlot,
    endSlot: b.endSlot,
    start: toHHMM(slotStart(b.startSlot)),
    end: toHHMM(slotEnd(b.endSlot)),
    topic: b.topic,
    purpose: b.purpose ?? null,
    attendees: b.attendees,
    fullName: b.fullName,
    department: b.department ?? null,
    phone: b.phone,
    email: b.email,
    status: b.status,
    cancelReason: b.cancelReason ?? null,
    cancelledAt: b.cancelledAt ?? null,
    createdAt: b.createdAt ?? null
});
