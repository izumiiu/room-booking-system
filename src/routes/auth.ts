import express from 'express';
const router = express.Router();
import handleLogin from '../controllers/authController.js';

router.post('/', handleLogin);


export default router;