"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware"); // Importa el middleware
const userController_1 = require("../controllers/userController"); // Importa los controladores
const router = (0, express_1.Router)();
// Rutas de usuario protegidas
router.get('/me', authMiddleware_1.authenticateJWT, userController_1.getMe);
router.put('/me', authMiddleware_1.authenticateJWT, userController_1.updateMe);
router.delete('/me', authMiddleware_1.authenticateJWT, userController_1.deleteMe);
exports.default = router;
