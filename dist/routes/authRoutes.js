"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController"); // Importa los controladores
const router = (0, express_1.Router)();
// Rutas de autenticación
router.post('/register', authController_1.registerUser);
router.post('/login', authController_1.loginUser);
exports.default = router;
