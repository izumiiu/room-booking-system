// ทดสอบเส้นทางที่ไม่ต้องแตะฐานข้อมูล: route table, middleware, validation, สิทธิ์
import request from 'supertest';
const { default: app } = await import('./dist/app.js');

let pass = 0, fail = 0;
const check = async (name, exec, expected) => {
    const res = await exec();
    const ok = res.status === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  -> ${res.status} ${JSON.stringify(res.body)}`);
    ok ? pass++ : fail++;
};

await check('GET  /api/health', () => request(app).get('/api/health'), 200);
await check('GET  /api/availability (ไม่ใส่ date)', () => request(app).get('/api/availability'), 400);
await check('GET  /api/availability?date=2026-02-30 (วันที่ไม่มีจริง)', () => request(app).get('/api/availability?date=2026-02-30'), 400);
await check('GET  /api/availability?date=28-10-2026 (ผิดรูปแบบ)', () => request(app).get('/api/availability?date=28-10-2026'), 400);
await check('POST /api/bookings (ไม่มี token)', () => request(app).post('/api/bookings').send({}), 401);
await check('GET  /api/bookings/me (ไม่มี token)', () => request(app).get('/api/bookings/me'), 401);
await check('GET  /api/admin/bookings (ไม่มี token)', () => request(app).get('/api/admin/bookings'), 401);
await check('POST /api/bookings (token มั่ว)', () => request(app).post('/api/bookings').set('Authorization', 'Bearer abc.def.ghi').send({}), 401);
await check('GET  /api/nope (ไม่มีเส้นทางนี้)', () => request(app).get('/api/nope'), 404);
await check('POST /api/auth/login (ไม่ส่งอะไรเลย)', () => request(app).post('/api/auth/login').send({}), 401);
await check('POST /api/auth/register (รหัสสั้น)', () => request(app).post('/api/auth/register').send({ username: 'somchai', password: '123' }), 400);
await check('POST /api/auth/logout (ไม่มี cookie)', () => request(app).post('/api/auth/logout'), 204);

console.log(`\n=== ผ่าน ${pass} / ไม่ผ่าน ${fail} ===`);
process.exit(fail ? 1 : 0);
