import mongoose, { Schema } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import { SLOT_COUNT } from '../utils/slot.js';

export interface IBooking {
    user: Types.ObjectId;

    // ช่วงเวลาที่จอง — เก็บเป็น "ป้ายชื่อ" ไม่ใช่จุดบนเส้นเวลา
    date: string;        // "2026-10-28" ห้ามเป็น Date เด็ดขาด
    startSlot: number;   // 0-11
    endSlot: number;     // 0-11 (รวมช่องนี้ด้วย)

    // รายละเอียดการประชุม
    topic: string;
    purpose?: string;
    attendees: number;

    // ข้อมูลติดต่อ ณ ตอนที่จอง (snapshot — ไม่ดึงสดจาก User)
    fullName: string;
    department?: string;
    phone: string;
    email: string;

    status: 'booked' | 'cancelled';
    cancelledBy?: Types.ObjectId;
    cancelReason?: string;
    cancelledAt?: Date;

    // timestamps เติมให้เอง
    createdAt?: Date;
    updatedAt?: Date;
}

export type BookingDoc = HydratedDocument<IBooking>;

const bookingSchema = new Schema<IBooking>({
    user:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startSlot: { type: Number, required: true, min: 0, max: SLOT_COUNT - 1 },
    endSlot:   { type: Number, required: true, min: 0, max: SLOT_COUNT - 1 },

    topic:     { type: String, required: true, trim: true, maxlength: 200 },
    purpose:   { type: String, trim: true, maxlength: 500 },
    attendees: { type: Number, required: true, min: 1, max: 500 },

    fullName:   { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, trim: true, maxlength: 120 },
    phone:      { type: String, required: true, trim: true, maxlength: 20 },
    email:      { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },

    status:       { type: String, enum: ['booked', 'cancelled'], default: 'booked', required: true },
    cancelledBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    cancelledAt:  { type: Date }
}, { timestamps: true });

bookingSchema.index({ date: 1, status: 1 });   // admin: การจองของวันที่เลือก
bookingSchema.index({ user: 1, date: -1 });    // user: การจองของฉัน ใหม่สุดก่อน

export default mongoose.model<IBooking>('Booking', bookingSchema);
