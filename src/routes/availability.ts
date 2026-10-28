import { Router } from 'express';
import { getAvailability } from '../controllers/availabilityController.js';

const router = Router();

// เปิดสาธารณะ: ให้คนที่ยังไม่ล็อกอินดูตารางก่อนตัดสินใจสมัครได้
router.get('/', getAvailability);

export default router;
