import { Router } from 'express';
import verifyJWT from '../middlewares/verifyJWT.js';
import {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking
} from '../controllers/bookingsController.js';

const router = Router();

// ทุกเส้นในไฟล์นี้ต้องล็อกอิน — เขียนที่เดียว เพิ่ม route ใหม่แล้วลืมไม่ได้
router.use(verifyJWT);

router.post('/',           createBooking);
router.get('/me',          getMyBookings);      // ★ ต้องอยู่ก่อน /:id ไม่งั้น "me" จะถูกจับเป็น id
router.get('/:id',         getBookingById);
router.post('/:id/cancel', cancelBooking);

export default router;
