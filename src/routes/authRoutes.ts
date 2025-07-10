import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController'; // Importa los controladores

const router: Router = Router();

// Rutas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
