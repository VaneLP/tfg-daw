import { Router } from 'express';
import { register, login, validateToken } from '../controllers/auth.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use((req, res, next) => {
    next();
});

//Rutas
router.post('/register', register);
router.post('/login', login);
router.get('/validate', authenticate, validateToken);

export default router;