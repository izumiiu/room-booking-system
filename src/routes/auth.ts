import { Router } from 'express';
import verifyJWT from '../middlewares/verifyJWT.js';
import handleRegister from '../controllers/registerController.js';
import handleLogin from '../controllers/authController.js';
import handleRefresh from '../controllers/refreshController.js';
import handleLogout from '../controllers/logoutController.js';
import { getMe } from '../controllers/meController.js';

const router = Router();

// ใช้ router.use(verifyJWT) ไม่ได้ เพราะ 4 เส้นแรกต้องเปิดให้คนที่ยังไม่ได้ล็อกอิน
router.post('/register', handleRegister);
router.post('/login',    handleLogin);
router.post('/refresh',  handleRefresh);
router.post('/logout',   handleLogout);
router.get('/me',        verifyJWT, getMe);

export default router;
