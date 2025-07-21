import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passport from 'passport'; // Importa passport
import authRoutes from './routes/authRoutes'; // Asegúrate de que la ruta sea correcta
import userRoutes from './routes/userRoutes';
import audioRoutes from './routes/audioRoutes';
import path from 'path';
// Carga las variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8888;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/music'; // ¡Cambia esto por tu URI real!

// Middlewares
app.use(express.json()); // Para parsear cuerpos de petición JSON
app.use(passport.initialize()); // Inicializa Passport

// Importa y configura Passport (asegúrate de que esta ruta sea correcta)
// Este archivo solo necesita ser importado para que las estrategias de Passport se registren.
import './config/passport';

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audio', audioRoutes);
// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend de tu aplicación funcionando!');
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conexión a la base de datos
mongoose.connect(MONGODB_URI)
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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal en el servidor!');
});
