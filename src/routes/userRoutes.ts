import { Router } from 'express';
import { authenticateJWT, asyncHandler } from '../middleware/authMiddleware'; // Importa el middleware
import { getMe, updateMe, deleteMe } from '../controllers/userController'; // Importa los controladores

const router: Router = Router();

// Rutas de usuario protegidas
router.get('/me', authenticateJWT, getMe);
router.put('/me', authenticateJWT, updateMe);
router.delete('/me', authenticateJWT, deleteMe);

export default router;
