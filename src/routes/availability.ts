import { Router } from 'express';
import { getAvailability, getDays } from '../controllers/availabilityController.js';

const router = Router();

// เปิดสาธารณะ: ให้คนที่ยังไม่ล็อกอินดูตารางก่อนตัดสินใจสมัครได้
router.get('/',     getAvailability);   // 12 ช่องของวันเดียว
router.get('/days', getDays);           // เปิด/ปิดของหลายวัน ใช้กับแถบเลือกวัน

export default router;
