import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
    getAllBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost
} from '../controllers/blog.js';

const router = Router();
router.use((req, res, next) => {
    next();
});

//Rutas
router.get('/', getAllBlogPosts);
router.get('/:postId', getBlogPostById);
router.post('/', authenticate, authorize(['Refugio', 'Admin']), createBlogPost);
router.put('/:postId', authenticate, authorize(['Refugio', 'Admin']), updateBlogPost);
router.delete('/:postId', authenticate, authorize(['Refugio', 'Admin']), deleteBlogPost);

export default router;