import DayOverride from '../models/DayOverride.js';
import { addDays, isWeekend } from '../utils/time.js';

// ตรรกะเปิด-ปิดวันทั้งหมดของระบบอยู่ตรงนี้ที่เดียว
// "ถ้า admin สั่งไว้ ใช้ตามที่สั่ง ถ้าไม่ได้สั่ง ใช้กฎเสาร์อาทิตย์"
export const isDayOpen = async (date: string): Promise<boolean> => {
    const override = await DayOverride.findOne({ date }).lean().exec();
    if (override) return override.isOpen;
    return !isWeekend(date);
};

export interface DayState {
    date: string;
    isOpen: boolean;
    note: string | null;
}

/**
 * สถานะเปิด-ปิดของทุกวันในช่วง ขอทีเดียวจบ
 *
 * มีไว้ให้หน้าเลือกวันของผู้ใช้ — ก่อนหน้านี้ frontend เดาเอาเองว่าเสาร์อาทิตย์ปิด
 * ซึ่งผิดทันทีที่ admin สั่งเปิดวันเสาร์เป็นกรณีพิเศษ หรือสั่งปิดวันธรรมดา
 * กฎว่าวันไหนเปิดต้องมีที่มาที่เดียวคือ backend
 */
export const getDayStates = async (from: string, to: string): Promise<DayState[]> => {
    const overrides = await DayOverride.find({ date: { $gte: from, $lte: to } }).lean().exec();
    const byDate = new Map(overrides.map((o) => [o.date, o]));

    const out: DayState[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
        const o = byDate.get(d);
        out.push({
            date: d,
            isOpen: o ? o.isOpen : !isWeekend(d),
            note: o?.note ?? null
        });
    }
    return out;
};
