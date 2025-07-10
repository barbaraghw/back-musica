"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Controlador para el registro de usuarios
const registerUser = async (req, res) => {
    try {
        const { email, password, username, isAuthor } = req.body;
        const newUser = new User_1.default({ email, password, username, isAuthor: isAuthor || false });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    }
    catch (error) {
        if (error.code === 11000) {
            let message = 'El email ya está registrado.';
            if (error.keyPattern && error.keyPattern.username) {
                message = 'El nombre de usuario ya está en uso.';
            }
            return res.status(409).json({ message });
        }
        res.status(500).json({ message: 'Error al registrar usuario.', error: error.message });
    }
};
exports.registerUser = registerUser;
// Controlador para el login de usuarios
const loginUser = (req, res, next) => {
    console.log('¡Petición de login recibida en authController!');
    passport_1.default.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Error de Passport en callback:', err);
            return next(err);
        }
        if (!user) {
            console.log('Autenticación fallida: usuario no encontrado o credenciales inválidas.');
            return res.status(401).json({ message: info.message || 'Credenciales inválidas.' });
        }
        req.login(user, { session: false }, (err) => {
            if (err) {
                console.error('Error en req.login:', err);
                return next(err);
            }
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error('JWT_SECRET no está definido en las variables de entorno.');
                return res.status(500).json({ message: 'Error de configuración del servidor.' });
            }
            console.log(`[LOGIN SUCCESS] User: ${user.username}, isAuthor: ${user.isAuthor}`);
            // Crea el payload del JWT con _id como string
            const jwtPayload = {
                _id: user._id.toString(), // Convierte ObjectId a string
                email: user.email,
                username: user.username,
                isAuthor: user.isAuthor,
            };
            const token = jsonwebtoken_1.default.sign(jwtPayload, secret, { expiresIn: '1h' });
            console.log('Login exitoso, token generado.');
            return res.json({ user: { id: user._id, email: user.email, username: user.username, isAuthor: user.isAuthor }, token });
        });
    })(req, res, next);
};
exports.loginUser = loginUser;
