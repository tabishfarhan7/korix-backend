import { Router } from 'express';
import { register, login, profile, logout } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require valid JWT cookie)
router.get('/profile', protect, profile);
router.post('/logout', protect, logout);

export default router;
