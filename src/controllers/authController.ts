import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser'; // Importa IAuthenticatedUser


// Define una interfaz para el cuerpo de la petición de registro
interface RegisterRequestBody {
    email: string;
    password: string;
    username: string;
    isAuthor?: boolean;
}
interface LoginRequestBody {
    email: string;
    password: string;
}

// Controlador para el registro de usuarios
export const registerUser = async (req: Request<any, any, RegisterRequestBody>, res: Response) => {
    try {
        const { email, password, username, isAuthor } = req.body;
        const newUser = new User({ email, password, username, isAuthor: isAuthor || false });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error: any) {
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

// Controlador para el login de usuarios
export const loginUser = (
    req: Request<any, any, LoginRequestBody>,
    res: Response,
    next: NextFunction
) => {
    console.log('¡Petición de login recibida en authController!');

    passport.authenticate('local', { session: false }, (err: Error, user: IUser, info: { message?: string }) => {
        if (err) {
            console.error('Error de Passport en callback:', err);
            return next(err);
        }
        if (!user) {
            console.log('Autenticación fallida: usuario no encontrado o credenciales inválidas.');
            return res.status(401).json({ message: info.message || 'Credenciales inválidas.' });
        }

        req.login(user, { session: false }, (err: Error | undefined) => {
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
            const jwtPayload: IAuthenticatedUser = {
                _id: user._id.toString(), // Convierte ObjectId a string
                email: user.email,
                username: user.username,
                isAuthor: user.isAuthor,
            };

            const token = jwt.sign(jwtPayload, secret, { expiresIn: '1h' });

            console.log('Login exitoso, token generado.');
            return res.json({ user: { id: user._id, email: user.email, username: user.username, isAuthor: user.isAuthor }, token });
        });
    })(req, res, next);
};
