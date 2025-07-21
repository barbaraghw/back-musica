// backend/src/routes/audioRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Import fs for file system operations
import Song, { ISong } from '../models/Songs'; // Import the Song model (assuming it's defined)

const router = Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  // Se ha tipado explícitamente el callback 'cb' y se asegura que siempre reciba 2 argumentos
  destination: (req, file, cb: (error: Error | null, destination: string) => void) => {
    let uploadDir: string;
    // Determine the upload directory based on the file fieldname
    if (file.fieldname === 'audio') {
      uploadDir = path.join(__dirname, '../../uploads/audio'); // Directory for audio files
    } else if (file.fieldname === 'image') {
      uploadDir = path.join(__dirname, '../../uploads/images'); // Directory for image files
    } else {
      // Fallback or error if fieldname is unexpected
      // Cuando hay un error, el segundo argumento debe ser una cadena vacía o un valor por defecto.
      return cb(new Error('Unexpected fieldname'), '');
    }

    // Ensure the directory exists, create it if it doesn't
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  // Se ha tipado explícitamente el callback 'cb' para asegurar la compatibilidad
  filename: (req, file, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter with proper typing
// Se asegura que el callback 'cb' siempre reciba 2 argumentos
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      // When there's an error, the second argument must be 'false'. false);
    }
  } else if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // When there's an error, the second argument must be 'false'. false);
    }
  } else {
    // This block runs if the file fieldname is neither 'audio' nor 'image'.
    // When there's an error, the second argument must be 'false'
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Combined limit for all files, or you can set individual limits
  },
});

// ====================================================================
// RUTA: Carga de archivos de audio y imagen
// Accesible en POST /api/audio/upload
// ====================================================================
router.post('/upload',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  async (req, res) => { // Made async to use await for database operations
    const audioFile = (req.files as { [fieldname: string]: Express.Multer.File[] })['audio']?.[0];
    const imageFile = (req.files as { [fieldname: string]: Express.Multer.File[] })['image']?.[0];

    console.log('Backend: req.files:', req.files);
    console.log('Backend: req.body:', req.body);

    if (!audioFile || !imageFile) {
      return res.status(400).json({ message: 'Se requieren un archivo de audio y una imagen.' });
    }

    const { title, artistGroup, album, genre, userId } = req.body;

    if (!title || !artistGroup || !album || !genre || !userId) {
      // Clean up uploaded files if metadata is missing
      fs.unlink(audioFile.path, (err) => { if (err) console.error('Error deleting audio file:', err); });
      fs.unlink(imageFile.path, (err) => { if (err) console.error('Error deleting image file:', err); });
      return res.status(400).json({ message: 'Faltan metadatos de la canción (título, artista, álbum, género, userId).' });
    }

    try {
      // Create a new Song document and save it to MongoDB
      const newSong: ISong = new Song({
        title,
        artistGroup,
        album,
        genre,
        userId,
        audioPath: `/uploads/audio/${audioFile.filename}`, // Store relative path
        imagePath: `/uploads/images/${imageFile.filename}`, // Store relative path
        uploadDate: new Date(),
      });

      await newSong.save(); // Save the song to the database

      console.log(`Audio subido: ${audioFile.filename} por el usuario: ${userId || 'Desconocido'}`);
      console.log(`Imagen subida: ${imageFile.filename} para la canción: ${title || 'Desconocido'}`);
      console.log('Metadatos de la canción guardados en DB:', { title, artistGroup, album, genre });

      res.status(200).json({
        message: 'Archivo de audio e imagen subidos exitosamente y metadatos guardados.',
        songId: newSong._id, // Return the ID of the new song
        audioFilename: audioFile.filename,
        audioFilePath: newSong.audioPath,
        imageFilename: imageFile.filename,
        imageFilePath: newSong.imagePath,
        userId: userId,
        title: title,
        artistGroup: artistGroup,
        album: album,
        genre: genre,
      });
    } catch (error) {
      console.error('Error al guardar la canción en la base de datos:', error);
      // Clean up uploaded files if database save fails
      fs.unlink(audioFile.path, (err) => { if (err) console.error('Error deleting audio file:', err); });
      fs.unlink(imageFile.path, (err) => { if (err) console.error('Error deleting image file:', err); });
      res.status(500).json({ message: 'Error interno del servidor al guardar la canción.' });
    }
  }
);

// ====================================================================
// NUEVA RUTA: Obtener todas las canciones disponibles
// Accesible en GET /api/audio/songs
// ====================================================================
router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find({}); // Fetch all songs from the database
    res.status(200).json(songs);
  } catch (error) {
    console.error('Error al obtener las canciones:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener las canciones.' });
  }
});

export default router;
