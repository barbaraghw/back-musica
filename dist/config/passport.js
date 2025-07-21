"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const User_1 = __importDefault(require("../models/User")); // Importa IUser y tu modelo User
const dotenv_1 = __importDefault(require("dotenv")); // Importa dotenv para cargar variables de entorno
dotenv_1.default.config(); // Asegúrate de cargar las variables de entorno aquí también, si este archivo se ejecuta de forma independiente o antes que app.ts
// Local Strategy (para registro e inicio de sesión con email/password)
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email', // Campo que se usará como "username" (en este caso, el email)
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            // Pasa false y un mensaje para credenciales incorrectas
            return done(null, false, { message: 'Credenciales incorrectas.' });
        }
        // Asegúrate de que user es correctamente tipado como IUser para el método comparePassword
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Credenciales incorrectas.' });
        }
        // Cuando la autenticación es exitosa, devuelve el documento de usuario (tipado como IUser)
        return done(null, user);
    }
    catch (err) { // Captura cualquier error inesperado
        return done(err);
    }
}));
// JWT Strategy (para proteger rutas con token)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    // Es una buena práctica lanzar un error si una variable de entorno crítica falta
    console.error('JWT_SECRET no está definido en las variables de entorno. Usando un valor de respaldo, pero esto no es seguro para producción.');
    // En producción, podrías considerar process.exit(1) o lanzar un error real.
}
passport_1.default.use(new passport_jwt_1.Strategy({
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret || 'fallback_secret', // Usa el valor de .env o un valor de respaldo
}, async (jwtPayload, done) => {
    try {
        // FIX: Cambiado jwtPayload.id a jwtPayload._id para que coincida con el payload del token
        const user = await User_1.default.findById(jwtPayload._id); // Busca el usuario por el _id del payload
        if (!user) {
            // Usuario no encontrado para este ID
            return done(null, false);
        }
        // Devuelve el documento de usuario completo de Mongoose
        return done(null, user); // Casteo explícito a IUser
    }
    catch (err) { // Captura cualquier error inesperado
        return done(err);
    }
}));
// Este archivo no exporta la instancia de passport directamente si solo se importa para efectos secundarios
// (es decir, solo para ejecutar las llamadas a passport.use).
// Pero típicamente, solo importarlo en app.ts o server.ts es suficiente para configurar las estrategias.
