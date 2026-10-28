import { Router } from 'express';
import authRouter from './auth.js';
import availabilityRouter from './availability.js';
import bookingsRouter from './bookings.js';
import adminRouter from './admin.js';

const router = Router();

router.get('/health', (_req, res) => { res.json({ ok: true }); });

router.use('/auth',         authRouter);
router.use('/availability', availabilityRouter);
router.use('/bookings',     bookingsRouter);
router.use('/admin',        adminRouter);

export default router;
