import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
    postOneApplication,
    getMyApplications,
    getReceivedApplications,
    updateOneApplicationStatus,
    getApplicationsForPet,
    checkUserApplicationForPet
} from '../controllers/applications.js';

const router = Router();

router.use((req, res, next) => {
    next();
});

//Rutas
router.post('/pet/:mascotaId/apply', authenticate, authorize('Adoptante'), postOneApplication);
router.get('/my', authenticate, authorize('Adoptante'), getMyApplications);
router.get('/received', authenticate, authorize(['Refugio', 'Admin']), getReceivedApplications);
router.put('/:applicationId/status', authenticate, authorize(['Refugio', 'Admin']), updateOneApplicationStatus);
router.get('/for-pet/:mascotaId', authenticate, authorize(['Refugio', 'Admin']), getApplicationsForPet);
router.get('/check-user-app/pet/:mascotaId', authenticate, authorize('Adoptante'), checkUserApplicationForPet);


export default router;