"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMe = exports.updateMe = exports.getMe = void 0;
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = require("../middleware/authMiddleware"); // Importa asyncHandler
// Definir los límites de caracteres para consistencia
const MIN_LENGTH_PASSWORD = 3;
const MIN_LENGTH_USERNAME = 3;
const MAX_LENGTH_USERNAME = 30;
const MIN_LENGTH_EMAIL = 5;
const MAX_LENGTH_EMAIL = 50;
// Controlador para obtener los datos del usuario actual
exports.getMe = (0, authMiddleware_1.asyncHandler)(async (req, res) => {
    // req.user ya es de tipo IAuthenticatedUser gracias al middleware
    const userDocument = req.user;
    if (!userDocument) {
        res.status(404).json({ message: 'Usuario no encontrado o no autenticado.' });
        return;
    }
    // _id ya es string aquí
    res.status(200).json({ id: userDocument._id, email: userDocument.email, username: userDocument.username, isAuthor: userDocument.isAuthor });
});
// Controlador para actualizar los datos del usuario
exports.updateMe = (0, authMiddleware_1.asyncHandler)(async (req, res) => {
    const authenticatedUser = req.user; // req.user ya es IAuthenticatedUser
    if (!(authenticatedUser === null || authenticatedUser === void 0 ? void 0 : authenticatedUser._id)) {
        res.status(401).json({ message: 'Usuario no autenticado o ID de usuario no disponible.' });
        return;
    }
    const { email, password, newPassword, username } = req.body;
    // Al buscar con findById, el resultado es un Documento de Mongoose,
    // y seleccionamos la contraseña explícitamente para compararla.
    // Necesitamos buscar por el _id que viene del token (que es un string)
    const user = await User_1.default.findById(authenticatedUser._id).select('+password');
    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado.' });
        return;
    }
    if ((email !== undefined && email !== user.email) || (username !== undefined && username !== user.username) || newPassword) {
        if (!password) {
            res.status(400).json({ message: 'Se requiere la contraseña actual para actualizar el email, nombre de usuario o la contraseña.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Contraseña actual incorrecta.' });
            return;
        }
    }
    if (email !== undefined) {
        if (email.length < MIN_LENGTH_EMAIL || email.length > MAX_LENGTH_EMAIL) {
            res.status(400).json({ message: `El email debe tener entre ${MIN_LENGTH_EMAIL} y ${MAX_LENGTH_EMAIL} caracteres.` });
            return;
        }
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            res.status(400).json({ message: 'Por favor, introduce un email válido.' });
            return;
        }
        if (email !== user.email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                res.status(409).json({ message: 'El nuevo email ya está en uso.' });
                return;
            }
            user.email = email;
        }
    }
    if (username !== undefined) {
        if (username.length < MIN_LENGTH_USERNAME || username.length > MAX_LENGTH_USERNAME) {
            res.status(400).json({ message: `El nombre de usuario debe tener entre ${MIN_LENGTH_USERNAME} y ${MAX_LENGTH_USERNAME} caracteres.` });
            return;
        }
        if (username !== user.username) {
            const existingUser = await User_1.default.findOne({ username });
            if (existingUser) {
                res.status(409).json({ message: 'El nuevo nombre de usuario ya está en uso.' });
                return;
            }
            user.username = username;
        }
    }
    if (newPassword !== undefined) {
        if (password === newPassword) {
            res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
            return;
        }
        user.password = newPassword;
    }
    try {
        await user.save();
        res.status(200).json({ message: 'Perfil actualizado exitosamente.', user: { id: user._id.toString(), email: user.email, username: user.username, isAuthor: user.isAuthor } });
    }
    catch (error) {
        if (error.name === 'MongoServerError' && error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            if (field === 'email') {
                res.status(409).json({ message: `El email '${value}' ya está en uso.` });
            }
            else if (field === 'username') {
                res.status(409).json({ message: `El nombre de usuario '${value}' ya está en uso.` });
            }
            else {
                res.status(409).json({ message: `Valor duplicado para el campo ${field}: ${value}.` });
            }
            return;
        }
        console.error('Error al guardar el usuario:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar el perfil.' });
    }
});
// Controlador para eliminar el usuario
exports.deleteMe = (0, authMiddleware_1.asyncHandler)(async (req, res) => {
    const authenticatedUser = req.user; // req.user ya es IAuthenticatedUser
    if (!(authenticatedUser === null || authenticatedUser === void 0 ? void 0 : authenticatedUser._id)) {
        res.status(401).json({ message: 'Usuario no autenticado o ID de usuario no disponible.' });
        return;
    }
    const { password } = req.body;
    // Necesitamos buscar por el _id que viene del token (que es un string)
    const user = await User_1.default.findById(authenticatedUser._id).select('+password');
    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado.' });
        return;
    }
    if (!password || !(await user.comparePassword(password))) {
        res.status(401).json({ message: 'Contraseña incorrecta. No se pudo eliminar la cuenta.' });
        return;
    }
    await User_1.default.findByIdAndDelete(authenticatedUser._id);
    res.status(200).json({ message: 'Cuenta eliminada exitosamente.' });
});
