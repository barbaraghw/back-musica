// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import passport from 'passport';
import { IUser } from '../models/User'; // Importa IUser para tipado
import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser'; // Importa IAuthenticatedUser desde tu archivo

dotenv.config();

// NOTA IMPORTANTE: La interfaz AuthenticatedRequest ya NO se define aquí.
// Se maneja a través de la declaración de módulos en backend/src/types/express.d.ts.
// Asegúrate de que ese archivo exista y esté configurado en tu tsconfig.json.

// Middleware para manejar errores asíncronos en las rutas
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Middleware para proteger las rutas (usando JwtStrategy de Passport)
// El tipo RequestHandler de Express ya es compatible con la extensión global de Request.
export const authenticateJWT: RequestHandler = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: IUser | false, info: { message?: string }) => {
    if (err) {
      console.error('Error durante la autenticación JWT:', err);
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || 'No autorizado. Token inválido o expirado.' });
    }

    // Construimos explícitamente un objeto IAuthenticatedUser a partir de las propiedades de IUser.
    // Esto es crucial para manejar la conversión de ObjectId a string para _id
    // y asegurar que todas las propiedades requeridas estén presentes y sean del tipo correcto.
     const authenticatedUser: IAuthenticatedUser = {
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

// NOTA: La función 'authenticateToken' manual ha sido eliminada.
// Asegúrate de usar 'authenticateJWT' en tus rutas protegidas.
