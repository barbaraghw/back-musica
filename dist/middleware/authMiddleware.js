"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = exports.asyncHandler = void 0;
const passport_1 = __importDefault(require("passport"));
// Middleware para manejar errores asíncronos en las rutas
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncHandler = asyncHandler;
// Middleware para proteger las rutas (usando JwtStrategy)
const authenticateJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Error durante la autenticación JWT:', err);
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || 'No autorizado. Token inválido o expirado.' });
        }
        // Construye un objeto IAuthenticatedUser a partir del IUser
        // Asegurando que _id sea un string
        const authenticatedUser = {
            _id: user._id.toString(), // Convierte ObjectId a string
            email: user.email,
            username: user.username,
            isAuthor: user.isAuthor,
        };
        req.user = authenticatedUser; // Asigna el objeto con el tipo correcto
        next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
