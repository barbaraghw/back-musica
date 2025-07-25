import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User, { IUser } from '../models/User'; // Importa IUser y tu modelo User
import dotenv from 'dotenv'; // Importa dotenv para cargar variables de entorno
import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser';

dotenv.config(); // Asegúrate de cargar las variables de entorno aquí también, si este archivo se ejecuta de forma independiente o antes que app.ts

// Local Strategy (para registro e inicio de sesión con email/password)
passport.use(new LocalStrategy({
    usernameField: 'email', // Campo que se usará como "username" (en este caso, el email)
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Pasa false y un mensaje para credenciales incorrectas
            return done(null, false, { message: 'Credenciales incorrectas.' });
        }
        // Asegúrate de que user es correctamente tipado como IUser para el método comparePassword
        const isMatch = await (user as IUser).comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Credenciales incorrectas.' });
        }
        // Cuando la autenticación es exitosa, devuelve el documento de usuario (tipado como IUser)
        const authenticatedUser: IAuthenticatedUser = {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        isAuthor: user.isAuthor
      };

      return done(null, authenticatedUser); // ✅ Ahora sí, sin error
    } catch (err) {
      return done(err);
    }
  }
));

// JWT Strategy (para proteger rutas con token)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    // Es una buena práctica lanzar un error si una variable de entorno crítica falta
    console.error('JWT_SECRET no está definido en las variables de entorno. Usando un valor de respaldo, pero esto no es seguro para producción.');
    // En producción, podrías considerar process.exit(1) o lanzar un error real.
}

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret || 'fallback_secret', // Usa el valor de .env o un valor de respaldo
}, async (jwtPayload, done) => {
    try {
        // FIX: Cambiado jwtPayload.id a jwtPayload._id para que coincida con el payload del token
        const user = await User.findById(jwtPayload._id); // Busca el usuario por el _id del payload
        if (!user) {
            // Usuario no encontrado para este ID
            return done(null, false);
        }
        // Devuelve el documento de usuario completo de Mongoose
        return done(null, user as IUser); // Casteo explícito a IUser
    } catch (err: any) { // Captura cualquier error inesperado
        return done(err);
    }
}));

// Este archivo no exporta la instancia de passport directamente si solo se importa para efectos secundarios
// (es decir, solo para ejecutar las llamadas a passport.use).
// Pero típicamente, solo importarlo en app.ts o server.ts es suficiente para configurar las estrategias.
