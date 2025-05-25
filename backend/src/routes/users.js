import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getAllUsers, profile, updateMyProfile, approveRefugio, rejectRefugio, getPendingRefugios,deleteUserById } from '../controllers/users.js';

const router = Router();
router.use((req, res, next) => {
    next();
});

//Rutas
router.get('/profile', authenticate, profile);
router.put('/profile', authenticate, updateMyProfile);
router.get('/', authenticate, authorize('Admin'), getAllUsers);
router.get('/admin/refugios/pending', authenticate, authorize('Admin'), getPendingRefugios); 
router.put('/admin/refugios/:refugioId/approve', authenticate, authorize('Admin'), approveRefugio);
router.put('/admin/refugios/:refugioId/reject', authenticate, authorize('Admin'), rejectRefugio); 
router.delete('/:userId', authenticate, authorize('Admin'), deleteUserById); 

export default router;