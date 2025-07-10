import { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import { IUser } from '../models/User'; // Importa IUser
import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser'; // Importa IAuthenticatedUser

// Middleware para manejar errores asíncronos en las rutas
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);

// Middleware para proteger las rutas (usando JwtStrategy)
export const authenticateJWT: RequestHandler = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err: Error, user: IUser | false, info: { message?: string }) => {
        if (err) {
            console.error('Error durante la autenticación JWT:', err);
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info?.message || 'No autorizado. Token inválido o expirado.' });
        }
        // Construye un objeto IAuthenticatedUser a partir del IUser
        // Asegurando que _id sea un string
        const authenticatedUser: IAuthenticatedUser = {
            _id: user._id.toString(), // Convierte ObjectId a string
            email: user.email,
            username: user.username,
            isAuthor: user.isAuthor,
        };
        req.user = authenticatedUser; // Asigna el objeto con el tipo correcto
        next();
    })(req, res, next);
};
