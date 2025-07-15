"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport")); // Importa passport
const authRoutes_1 = __importDefault(require("./routes/authRoutes")); // Asegúrate de que la ruta sea correcta
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Asegúrate de que la ruta sea correcta
const spotifyRoutes_1 = __importDefault(require("./routes/spotifyRoutes"));
// Carga las variables de entorno desde .env
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/music'; // ¡Cambia esto por tu URI real!
// Middlewares
app.use(express_1.default.json()); // Para parsear cuerpos de petición JSON
app.use(passport_1.default.initialize()); // Inicializa Passport
// Importa y configura Passport (asegúrate de que esta ruta sea correcta)
// Este archivo solo necesita ser importado para que las estrategias de Passport se registren.
require("./config/passport");
// Rutas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/spotify', spotifyRoutes_1.default);
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Backend de tu aplicación funcionando!');
});
// Conexión a la base de datos
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('Conectado a MongoDB');
    // Inicia el servidor solo después de una conexión exitosa a la base de datos
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Error al conectar a MongoDB Atlas:', err);
    process.exit(1); // Sale del proceso si no se puede conectar a la DB
});
// Manejo de errores global (opcional, pero recomendado)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal en el servidor!');
});
