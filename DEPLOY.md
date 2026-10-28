# คู่มือ deploy ระบบจองห้อง TC-402

ระบบมี 3 ชิ้นที่อยู่คนละที่:

| ชิ้น | อยู่ที่ | ฟรีไหม |
|---|---|---|
| ฐานข้อมูล | MongoDB Atlas | ฟรี (M0) |
| backend (`room-booking-system`) | Render | ฟรี แต่หลับเมื่อไม่มีคนใช้ 15 นาที |
| frontend (`room-booking-front`) | Vercel | ฟรี |

ทำตามลำดับนี้เท่านั้น เพราะแต่ละขั้นต้องใช้ค่าจากขั้นก่อนหน้า

---

## ขั้น 0 — เตรียมความลับ

สร้างกุญแจสองตัวสำหรับเซ็น token เก็บไว้ก่อน เดี๋ยวต้องใช้

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

รันสองครั้ง ได้สองค่าที่ไม่ซ้ำกัน ค่าแรกคือ `ACCESS_TOKEN_SECRET` ค่าที่สองคือ `REFRESH_TOKEN_SECRET`

**อย่าใช้ค่าเดียวกับที่ใช้ตอน dev** และอย่าให้สองค่านี้ซ้ำกันเอง

---

## ขั้น 1 — เปิด Atlas ให้ Render เข้าถึงได้

ตอนนี้ Atlas อนุญาตเฉพาะ IP เครื่องนาย Render จะต่อไม่ได้

1. เข้า cloud.mongodb.com → เลือก cluster → เมนูซ้าย **Network Access**
2. **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) → Confirm

> ปลอดภัยไหม — ยังเข้าไม่ได้ถ้าไม่มี username/password ของฐานข้อมูล ที่ต้องเปิดกว้างเพราะ Render
> เปลี่ยน IP ของเครื่องที่รันตลอดเวลา การล็อก IP จึงทำไม่ได้ใน free tier
> สิ่งที่ต้องทำแทนคือ **รหัสผ่านฐานข้อมูลต้องยาวและไม่ซ้ำกับที่อื่น**

3. เมนู **Database Access** → ตรวจว่า user มีสิทธิ์ `readWrite` บน database ที่ใช้
4. ปุ่ม **Connect → Drivers** → ก็อป connection string เก็บไว้ (อย่าลืมแทน `<password>` ด้วยรหัสจริง)

---

## ขั้น 2 — deploy backend ขึ้น Render

1. สมัครที่ render.com ด้วยบัญชี GitHub
2. **New → Web Service** → เลือก repo `room-booking-system`
3. ตั้งค่า:

| ช่อง | ใส่ |
|---|---|
| Language | Node |
| Branch | `main` |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

> **`--include=dev` สำคัญมาก** — พอตั้ง `NODE_ENV=production` แล้ว npm จะข้ามการติดตั้ง
> devDependencies ซึ่ง `typescript` อยู่ในนั้น ถ้าไม่ใส่ธงนี้ `npm run build` จะพังด้วย
> ข้อความว่าหา `tsc` ไม่เจอ

4. กด **Advanced** → **Add Environment Variable** ใส่ทีละตัว:

```
DATABASE_URI          = connection string จากขั้น 1
ACCESS_TOKEN_SECRET   = ค่าแรกจากขั้น 0
REFRESH_TOKEN_SECRET  = ค่าที่สองจากขั้น 0
NODE_ENV              = production
ALLOWED_ORIGINS       = http://localhost:5173
```

`ALLOWED_ORIGINS` ใส่ชั่วคราวไปก่อน เดี๋ยวขั้น 4 ค่อยกลับมาแก้เป็น URL จริงของ frontend

5. **Health Check Path** ใส่ `/api/health`
6. กด **Create Web Service** แล้วรอ build (ครั้งแรกประมาณ 3–5 นาที)

### ตรวจว่าขึ้นจริง

เปิด `https://ชื่อ-service.onrender.com/api/health` ต้องเห็น

```json
{"ok":true}
```

แล้วดูแท็บ **Logs** ต้องเห็นสามบรรทัดนี้:

```
[config] NODE_ENV=production
[config] cookie: secure=true sameSite=none
Connected to MongoDB
```

ถ้า `NODE_ENV` ขึ้นว่า `(ไม่ได้ตั้ง)` แปลว่าลืมใส่ตัวแปร — **ต้องแก้ก่อนไปต่อ** ไม่งั้น cookie
จะไม่ถูกส่งข้ามโดเมน แล้วจะล็อกอินค้างไม่ได้ทั้งระบบ

**ก็อป URL ของ service เก็บไว้** เดี๋ยวใช้ขั้น 3

---

## ขั้น 3 — deploy frontend ขึ้น Vercel

1. สมัครที่ vercel.com ด้วยบัญชี GitHub
2. **Add New → Project** → เลือก repo `room-booking-front`
3. Framework Preset จะขึ้น **Vite** เอง ไม่ต้องแก้ Build Command หรือ Output Directory
4. กาง **Environment Variables** ใส่:

```
VITE_USE_MOCK  = false
VITE_API_URL   = https://ชื่อ-service.onrender.com/api
```

> ต่อท้ายด้วย `/api` ด้วย และ **ห้ามมี `/` ปิดท้าย** เพราะโค้ดต่อ path เองเช่น `/auth/login`
> ถ้าใส่ `.../api/` จะกลายเป็น `//auth/login` แล้วได้ 404

5. กด **Deploy** รอประมาณ 1–2 นาที
6. ก็อป URL ที่ได้ เช่น `https://room-booking-front.vercel.app`

---

## ขั้น 4 — บอก backend ว่าใครเรียกได้

กลับไปที่ Render → service → **Environment** → แก้

```
ALLOWED_ORIGINS = https://room-booking-front.vercel.app
```

**ห้ามมี `/` ปิดท้าย** เพราะ browser ส่ง header `Origin` มาแบบไม่มี ถ้าเทียบไม่ตรงจะโดนบล็อกทุกคำขอ

Render จะ restart ให้เอง รอสักครู่

---

## ขั้น 5 — สร้างบัญชีเจ้าหน้าที่

1. เปิดเว็บจริง → สมัครบัญชีหนึ่งอัน (เช่น `admin`)
2. เข้า Atlas → **Browse Collections** → `users` → หาแถวนั้น
3. แก้ `role` จาก `normalUser` เป็น `admin` → Update
4. ออกจากระบบแล้วล็อกอินใหม่ ต้องเด้งไปหน้า dashboard

> ระบบไม่มีทางสมัครเป็น admin ได้จากหน้าเว็บโดยตั้งใจ ไม่งั้นใครก็ตั้งตัวเองเป็นเจ้าหน้าที่ได้

---

## ขั้น 6 — ตรวจให้ครบวง

ไล่ตามนี้บนเว็บจริง ทุกข้อต้องผ่าน:

- [ ] สมัครบัญชีใหม่ได้
- [ ] ล็อกอินแล้วเข้าหน้า "การจองของฉัน"
- [ ] **กด F5 แล้วยังล็อกอินอยู่** ← ข้อสำคัญที่สุด ถ้าหลุดแปลว่า cookie ข้ามโดเมนไม่ทำงาน
- [ ] จองได้ และรายการขึ้นในหน้าการจองของฉัน
- [ ] ยกเลิกได้ และช่องเวลากลับมาว่าง
- [ ] เปิด URL `/bookings` ตรง ๆ ในแท็บใหม่แล้วไม่ขึ้น 404
- [ ] ล็อกอินด้วยบัญชี admin แล้วเข้า dashboard ได้
- [ ] ปิดห้องหนึ่งวัน แล้วฝั่งผู้ใช้เห็นว่าวันนั้นปิด

---

## เวลามีปัญหา ดูตรงไหน

| อาการ | สาเหตุที่เป็นไปได้มากที่สุด |
|---|---|
| ทุกหน้าขึ้น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" | `VITE_API_URL` ผิด หรือ backend กำลังหลับอยู่ (รอ 1 นาทีแล้วลองใหม่) |
| ล็อกอินผ่าน แต่ F5 แล้วหลุด | `NODE_ENV` ไม่ได้ตั้งเป็น production บน Render → cookie ไม่ secure เลยไม่ถูกส่ง |
| Console ขึ้น CORS error | `ALLOWED_ORIGINS` ไม่ตรงกับ URL ของ Vercel เป๊ะ ๆ (เช็ค https และ `/` ปิดท้าย) |
| กด F5 ที่ `/bookings` แล้ว 404 | ไฟล์ `vercel.json` ไม่ได้ถูก commit ขึ้นไป |
| build พังที่ Render บอกหา `tsc` ไม่เจอ | ลืม `--include=dev` ใน Build Command |
| ขึ้น 500 ตอนจอง | เปิด Logs ที่ Render ดูข้อความ error จริง |

**เครื่องมือที่ต้องใช้เป็น** — กด F12 ในเบราว์เซอร์ → แท็บ **Network** → กดทำสิ่งที่พัง →
คลิกคำขอที่เป็นสีแดง → ดู Status กับ Response จะบอกสาเหตุเกือบทุกครั้ง

---

## ข้อจำกัดของ free tier ที่ต้องรู้

Render แผนฟรีจะ**หลับหลังไม่มีคนเรียก 15 นาที** คนแรกที่เข้ามาหลังจากนั้นต้องรอ
ประมาณ 50 วินาทีกว่าหน้าจะโหลด — ตอนเดโมให้เปิดเว็บทิ้งไว้ก่อนเริ่ม 1 นาที

ถ้าจะใช้งานจริงต้องเลือกอย่างใดอย่างหนึ่ง:
- อัปเป็นแผนเสียเงินของ Render (ประมาณ $7/เดือน) แล้วมันจะไม่หลับ
- ย้ายไปเซิร์ฟเวอร์ของมหาวิทยาลัย

และอย่าลืมว่า**ทุกอย่างผูกกับบัญชีส่วนตัว** ถ้าจะส่งมอบให้มหาวิทยาลัยจริง ต้องย้ายเจ้าของ
ทั้ง GitHub, Render, Vercel และ Atlas ก่อนจบฝึกงาน ไม่งั้นระบบจะหายไปพร้อมบัญชีนาย
