"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = exports.asyncHandler = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
dotenv_1.default.config();
// NOTA IMPORTANTE: La interfaz AuthenticatedRequest ya NO se define aquí.
// Se maneja a través de la declaración de módulos en backend/src/types/express.d.ts.
// Asegúrate de que ese archivo exista y esté configurado en tu tsconfig.json.
// Middleware para manejar errores asíncronos en las rutas
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncHandler = asyncHandler;
// Middleware para proteger las rutas (usando JwtStrategy de Passport)
// El tipo RequestHandler de Express ya es compatible con la extensión global de Request.
const authenticateJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Error durante la autenticación JWT:', err);
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || 'No autorizado. Token inválido o expirado.' });
        }
        // Construimos explícitamente un objeto IAuthenticatedUser a partir de las propiedades de IUser.
        // Esto es crucial para manejar la conversión de ObjectId a string para _id
        // y asegurar que todas las propiedades requeridas estén presentes y sean del tipo correcto.
        const authenticatedUser = {
            _id: user._id.toString(), // Ensure _id is converted to string
            email: user.email,
            username: user.username,
            isAuthor: user.isAuthor,
        };
        // Asignamos el objeto construido a req.user.
        // Gracias a la declaración global en express.d.ts, TypeScript ahora sabe
        // que req.user puede ser de tipo IAuthenticatedUser.
        req.user = authenticatedUser;
        next();
    })(req, res, next);
};
exports.authenticateJWT = authenticateJWT;
// NOTA: La función 'authenticateToken' manual ha sido eliminada.
// Asegúrate de usar 'authenticateJWT' en tus rutas protegidas.
