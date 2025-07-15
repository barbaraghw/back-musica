// backend/src/routes/spotifyRoutes.ts
import { Router } from 'express';
import { spotifyLogin, spotifyCallback, refreshSpotifyToken } from '../controllers/spotifyController';

const router: Router = Router();

// Rutas para la autenticación de Spotify
router.get('/login', spotifyLogin);
router.get('/callback', spotifyCallback);
router.get('/refresh_token', refreshSpotifyToken);

export default router;
