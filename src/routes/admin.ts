import { Router } from 'express';
import verifyJWT from '../middlewares/verifyJWT.js';
import verifyRoles from '../middlewares/verifyRoles.js';
import {
    listAllBookings,
    cancelAnyBooking,
    listDayOverrides,
    setDayOverride,
    removeDayOverride
} from '../controllers/adminController.js';

const router = Router();

// verifyJWT ต้องมาก่อน verifyRoles เพราะตัวหลังอ่าน req.user ที่ตัวแรกใส่ไว้
router.use(verifyJWT, verifyRoles('admin'));

router.get('/bookings',               listAllBookings);
router.post('/bookings/:id/cancel',   cancelAnyBooking);

router.get('/day-overrides',          listDayOverrides);
router.post('/day-overrides',         setDayOverride);
router.delete('/day-overrides/:date', removeDayOverride);

export default router;
