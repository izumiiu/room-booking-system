import DayOverride from '../models/DayOverride.js';
import { isWeekend } from '../utils/time.js';

// ตรรกะเปิด-ปิดวันทั้งหมดของระบบอยู่ตรงนี้ที่เดียว
// "ถ้า admin สั่งไว้ ใช้ตามที่สั่ง ถ้าไม่ได้สั่ง ใช้กฎเสาร์อาทิตย์"
export const isDayOpen = async (date: string): Promise<boolean> => {
    const override = await DayOverride.findOne({ date }).lean().exec();
    if (override) return override.isOpen;
    return !isWeekend(date);
};
