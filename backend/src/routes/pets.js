import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
    getAllPets,
    getOnePet,
    postOnePet,
    deleteOnePet,
    updateOnePet
} from '../controllers/pets.js';

const router = Router();
router.use((req, res, next) => {
    next();
});

//Rutas
router.get('/', getAllPets);
router.get('/:mascotaId', getOnePet);
router.post('/', authenticate, authorize('Refugio'), postOnePet);
router.put('/:mascotaId', authenticate, authorize(['Refugio', 'Admin']), updateOnePet);
router.delete('/:mascotaId', authenticate, authorize(['Refugio', 'Admin']), deleteOnePet);

export default router;