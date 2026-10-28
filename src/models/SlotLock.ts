import mongoose, { Schema } from 'mongoose';
import type { Types } from 'mongoose';
import { SLOT_COUNT } from '../utils/slot.js';

// Booking เก็บการจองเป็น "ช่วง" ซึ่ง MongoDB บังคับไม่ได้ว่าช่วงห้ามทับกัน
// เราจึงแตกช่วงออกเป็นช่องเดี่ยว ๆ แล้วให้ unique index เป็นคนปฏิเสธคนที่สอง
export interface ISlotLock {
    date: string;
    slot: number;
    booking: Types.ObjectId;
}

const slotLockSchema = new Schema<ISlotLock>({
    date:    { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slot:    { type: Number, required: true, min: 0, max: SLOT_COUNT - 1 },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true }
});

// ★ บรรทัดเดียวที่กันการจองซ้อนทั้งระบบ — ไม่มี transaction ไม่มี lock ในแอป
slotLockSchema.index({ date: 1, slot: 1 }, { unique: true });

export default mongoose.model<ISlotLock>('SlotLock', slotLockSchema);
