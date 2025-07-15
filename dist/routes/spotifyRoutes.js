"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/spotifyRoutes.ts
const express_1 = require("express");
const spotifyController_1 = require("../controllers/spotifyController");
const router = (0, express_1.Router)();
// Rutas para la autenticación de Spotify
router.get('/login', spotifyController_1.spotifyLogin);
router.get('/callback', spotifyController_1.spotifyCallback);
router.get('/refresh_token', spotifyController_1.refreshSpotifyToken);
exports.default = router;
