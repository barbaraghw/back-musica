"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const User_1 = __importDefault(require("../models/User")); // Import IUser and your User model
// Local Strategy (for registration and login with email/password)
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            // Pass false and a message for incorrect credentials
            return done(null, false, { message: 'Credenciales incorrectas.' });
        }
        // Ensure user is correctly typed as IUser for comparePassword method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Credenciales incorrectas.' });
        }
        // When authentication is successful, return the user document (typed as IUser)
        return done(null, user);
    }
    catch (err) { // Catch any unexpected errors
        return done(err);
    }
}));
// JWT Strategy (to protect routes with token)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    // It's good practice to throw an error if a critical env var is missing
    console.error('JWT_SECRET is not defined in environment variables. Using a fallback, but this is not secure for production.');
    // In production, you might want to process.exit(1) or throw an actual error.
}
passport_1.default.use(new passport_jwt_1.Strategy({
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret || 'fallback_secret', // Use fallback if not defined (for dev, but warn)
}, async (jwtPayload, done) => {
    try {
        // Find user by ID from JWT payload
        const user = await User_1.default.findById(jwtPayload.id);
        if (!user) {
            // User not found for this ID
            return done(null, false);
        }
        // Return the full Mongoose user document
        return done(null, user); // Explicitly cast to IUser
    }
    catch (err) { // Catch any unexpected errors
        return done(err);
    }
}));
// This file doesn't export the passport instance directly if it's only imported for side effects
// (i.e., just to run the passport.use calls).
// But typically, just importing it in app.ts or server.ts is enough to set up strategies.
