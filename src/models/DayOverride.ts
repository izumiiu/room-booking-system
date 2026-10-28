import mongoose, { Schema } from 'mongoose';
import type { HydratedDocument, Types } from 'mongoose';

// "วันนี้ไม่ต้องใช้กฎปกติ ให้ใช้ค่านี้แทน"
// ครอบคลุมทั้งปิดวันธรรมดา และเปิดวันเสาร์อาทิตย์ ด้วย field เดียว
export interface IDayOverride {
    date: string;
    isOpen: boolean;
    note?: string;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export type DayOverrideDoc = HydratedDocument<IDayOverride>;

const dayOverrideSchema = new Schema<IDayOverride>({
    date:      { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    isOpen:    { type: Boolean, required: true },
    note:      { type: String, trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IDayOverride>('DayOverride', dayOverrideSchema);
