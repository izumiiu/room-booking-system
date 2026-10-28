// ตัวตรวจข้อมูลที่รับมาจากภายนอก ทุกตัวรับ unknown เพราะ req.body/req.query
// เป็นอะไรก็ได้ที่ผู้ใช้ส่งมา ไม่ใช่สิ่งที่เราควบคุม

// ===== บัญชีผู้ใช้ =====
export const isValidUsername = (u: unknown): u is string =>
    typeof u === 'string' && u.length >= 3 && u.length <= 32 && !/\s/.test(u);

export const isValidPassword = (p: unknown): p is string =>
    typeof p === 'string' && p.length >= 8 && p.length <= 128 && !/\s/.test(p);

// ===== ข้อความทั่วไป =====
export const isNonEmptyString = (v: unknown, max: number): v is string =>
    typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

// ===== วันที่ =====
export const isValidDateString = (v: unknown): v is string => {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(`${v}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return false;
    // กัน 2026-02-30 ที่ผ่าน regex แต่ไม่มีอยู่จริง (Date จะเลื่อนเป็น 03-02 แล้วไม่ตรงกับ input)
    return d.toISOString().slice(0, 10) === v;
};

// ===== รายละเอียดการจอง =====
export const isValidAttendees = (v: unknown): v is number =>
    typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 500;

export const isValidPhone = (v: unknown): v is string =>
    typeof v === 'string' && /^[0-9+\-\s()]{6,20}$/.test(v.trim());

export const isValidEmail = (v: unknown): v is string =>
    typeof v === 'string' && v.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isValidBookingStatus = (v: unknown): v is 'booked' | 'cancelled' =>
    v === 'booked' || v === 'cancelled';

// ===== ความปลอดภัย =====

// ผู้ใช้ส่งคำค้นมาแล้วเราเอาไปทำ regex ถ้าไม่ escape เขาส่ง (a+)+$ มาทำ server ค้างได้ (ReDoS)
export const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// query string เป็น string เสมอ ถ้าได้อย่างอื่นแปลว่าโดนยัด object มา -> ใช้ค่า default
export const toPositiveInt = (v: unknown, fallback: number): number => {
    if (typeof v !== 'string') return fallback;
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : fallback;
};
