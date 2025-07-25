// backend/src/types/express.d.ts
// Este archivo extiende las interfaces de Express para añadir tipado a req.user
// y los métodos de Passport.js en el objeto Request.

import { IUser } from '../models/User'; // Asegúrate de que la ruta sea correcta
import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser'; // Asegúrate de que la ruta sea correcta

declare global {
    namespace Express {
        interface User extends IAuthenticatedUser {}
        export interface Request {
            user?: IAuthenticatedUser; // Propiedad añadida por Passport al autenticar
            // Los métodos de login/logout/isAuthenticated/isUnauthenticated
            // pueden seguir usando IUser o el tipo que Passport les asigne internamente
            login(user: IUser, options: Record<string, any>, callback?: (err: Error | undefined) => void): void;
            logout(callback?: (err: Error) => void): void;
            isAuthenticated(): boolean;
            isUnauthenticated(): boolean;
        }
    }
}
