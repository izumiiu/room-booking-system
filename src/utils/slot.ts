// ค่าคงที่ของห้อง TC-402 — แก้ที่นี่ที่เดียว
export const OPEN_MIN = 8 * 60 + 30;   // 08:30 = 510 นาทีจากเที่ยงคืน
export const SLOT_MIN = 60;            // ความยาวสล็อต (นาที)
export const SLOT_COUNT = 12;          // 08:30-20:30 = 12 ชั่วโมง
export const MAX_ADVANCE_DAYS = 7;     // จองล่วงหน้าได้กี่วัน
export const MAX_ACTIVE_BOOKINGS = 3;  // โควต้าต่อคน

export const slotStart = (slot: number): number => OPEN_MIN + slot * SLOT_MIN;
export const slotEnd = (slot: number): number => slotStart(slot) + SLOT_MIN;

export const toHHMM = (min: number): string =>
    `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const isValidSlot = (s: unknown): s is number =>
    typeof s === 'number' && Number.isInteger(s) && s >= 0 && s < SLOT_COUNT;