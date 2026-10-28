import SlotLock from '../models/SlotLock.js';
import { SLOT_COUNT, slotStart, slotEnd, toHHMM } from '../utils/slot.js';
import { todayTH, nowMinutesTH } from '../utils/time.js';
import { isDayOpen } from './dayService.js';

export type SlotStatus = 'free' | 'booked' | 'past' | 'closed';

export interface SlotView {
    slot: number;
    start: string;
    end: string;
    status: SlotStatus;
}

export interface AvailabilityView {
    date: string;
    today: string;
    nowMinutes: number;
    isOpen: boolean;
    slots: SlotView[];
}

export const getTakenSlots = async (date: string): Promise<Set<number>> => {
    const locks = await SlotLock.find({ date }).select('slot').lean().exec();
    return new Set(locks.map((l) => l.slot));
};

// สถานะของ 12 ช่องในวันหนึ่ง — คำนวณสดทุกครั้ง ไม่เก็บลงฐานข้อมูล
// จึงไม่ต้องมี cron job มาไล่เปลี่ยนสถานะตอนเที่ยงคืน
export const buildAvailability = async (date: string): Promise<AvailabilityView> => {
    const today = todayTH();
    const nowMinutes = nowMinutesTH();
    const open = await isDayOpen(date);
    const taken: Set<number> = open ? await getTakenSlots(date) : new Set<number>();

    const slots: SlotView[] = [];
    for (let s = 0; s < SLOT_COUNT; s++) {
        let status: SlotStatus;
        if (!open) status = 'closed';
        else if (date < today) status = 'past';                                 // เทียบ string ได้เพราะ YYYY-MM-DD เรียงตรงกับเวลา
        else if (date === today && nowMinutes >= slotStart(s)) status = 'past';
        else if (taken.has(s)) status = 'booked';
        else status = 'free';

        slots.push({
            slot: s,
            start: toHHMM(slotStart(s)),
            end: toHHMM(slotEnd(s)),
            status
        });
    }

    return { date, today, nowMinutes, isOpen: open, slots };
};
