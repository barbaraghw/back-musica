"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSpotifyToken = exports.spotifyCallback = exports.spotifyLogin = void 0;
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Asegúrate de que las variables de entorno estén cargadas
// --- CONFIGURACIÓN DE SPOTIFY API (DESDE .env) ---
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
// Esta REDIRECT_URI debe ser la del backend, registrada en tu Dashboard de Spotify
const BACKEND_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
// Esta es la URI a la que tu backend redirigirá a tu frontend Expo después de la autenticación
const FRONTEND_REDIRECT_URI = process.env.FRONTEND_REDIRECT_URI || 'http://localhost:19006/auth';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
// Genera un estado aleatorio para la seguridad (prevención de CSRF)
const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
// Middleware para manejar errores asíncronos
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Inicia el proceso de autenticación de Spotify
exports.spotifyLogin = asyncHandler(async (req, res) => {
    const state = generateRandomString(16); // Genera un estado aleatorio
    // Define los ámbitos (scopes) que tu aplicación necesita
    const scope = 'user-read-private user-read-email playlist-read-private user-library-read user-top-read user-follow-read streaming user-modify-playback-state user-read-playback-state user-read-currently-playing app-remote-control';
    // Redirige al usuario a la página de autorización de Spotify
    res.redirect(SPOTIFY_AUTH_URL + '?' +
        querystring_1.default.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scope,
            redirect_uri: BACKEND_REDIRECT_URI,
            state: state
        }));
});
// Maneja el callback después de la autorización de Spotify
exports.spotifyCallback = asyncHandler(async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    // const storedState = req.cookies ? req.cookies[stateKey] : null; // Si usaras cookies para el estado
    // En una aplicación real, deberías verificar el 'state' para prevenir ataques CSRF
    // if (state === null || state !== storedState) {
    //   res.redirect(`${FRONTEND_REDIRECT_URI}?error=${encodeURIComponent('state_mismatch')}`);
    //   return;
    // }
    if (!code) {
        res.redirect(`${FRONTEND_REDIRECT_URI}?error=${encodeURIComponent('no_code_received')}`);
        return;
    }
    try {
        const response = await (0, axios_1.default)({
            method: 'post',
            url: SPOTIFY_TOKEN_URL,
            data: querystring_1.default.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: BACKEND_REDIRECT_URI,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'))
            },
        });
        const { access_token, refresh_token, expires_in } = response.data;
        // Redirige al frontend con los tokens.
        // Para mayor seguridad en producción, podrías guardar estos tokens en tu DB
        // asociados al usuario y luego redirigir con un token de sesión de tu propio backend.
        res.redirect(`${FRONTEND_REDIRECT_URI}?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
    }
    catch (error) {
        console.error('Error al intercambiar código por tokens:', error.response ? error.response.data : error.message);
        res.redirect(`${FRONTEND_REDIRECT_URI}?error=${encodeURIComponent('invalid_token_exchange')}`);
    }
});
// Refresca el token de acceso de Spotify
exports.refreshSpotifyToken = asyncHandler(async (req, res) => {
    const refresh_token = req.query.refresh_token;
    if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required.' });
    }
    try {
        const response = await (0, axios_1.default)({
            method: 'post',
            url: SPOTIFY_TOKEN_URL,
            data: querystring_1.default.stringify({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'))
            },
        });
        const { access_token, expires_in } = response.data;
        res.json({
            access_token: access_token,
            expires_in: expires_in
        });
    }
    catch (error) {
        console.error('Error al refrescar token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});
