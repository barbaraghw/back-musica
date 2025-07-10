import { IUser } from '../models/User'; // Asegúrate de que la ruta sea correcta

import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser'; // Asegúrate de que la ruta sea correcta

declare global {
    namespace Express {
        // Extiende la interfaz Request para añadir propiedades y métodos específicos de Passport
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
