import express from 'express';
const router = express.Router();
import handleLogout from '../controllers/logoutController.js';

router.route('/').post(handleLogout);

export default router;