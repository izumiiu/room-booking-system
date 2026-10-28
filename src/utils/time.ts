const TZ = 'Asia/Bangkok';

// "วันนี้" ในสายตาผู้ใช้ ไม่ใช่ของ server
export const todayTH = (): string =>
    new Date().toLocaleDateString('en-CA', { timeZone: TZ });   // "2026-10-28"

// เวลาตอนนี้เป็นนาทีจากเที่ยงคืน ใช้ตัดสินว่าสล็อตไหน "ผ่านไปแล้ว"
export const nowMinutesTH = (): number => {
    const parts = new Date()
        .toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit' })
        .split(':');
    return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
};

// เสาร์-อาทิตย์ไหม — ต้อง getUTCDay เท่านั้น
export const isWeekend = (date: string): boolean => {
    const d = new Date(`${date}T00:00:00Z`).getUTCDay();
    return d === 0 || d === 6;
};
// บวกวันแบบปลอดภัย ทำงานบน UTC ล้วนทั้งเส้น ผลจึงเหมือนกันทุกเครื่อง
export const addDays = (date: string, n: number): string => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
