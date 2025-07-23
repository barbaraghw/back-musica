// backend/src/routes/audioRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Import fs for file system operations
import Song, { ISong } from '../models/Songs'; // Import the Song model (assuming it's defined)

const router = Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  // El callback 'cb' se infiere correctamente o se usa un tipo genérico si es necesario.
  // Se asegura que siempre reciba 2 argumentos.
  destination: (req, file, cb) => { // Removed explicit type for cb, let TypeScript infer
    let uploadDir: string;
    // Determine the upload directory based on the file fieldname
    if (file.fieldname === 'audio') {
      uploadDir = path.join(__dirname, '../../uploads/audio'); // Directory for audio files
    } else if (file.fieldname === 'image') {
      uploadDir = path.join(__dirname, '../../uploads/images'); // Directory for image files
    } else {
      // Fallback or error if fieldname is unexpected
      // When there's an error, the second argument must be an empty string or a default value.
      return cb(new Error('Unexpected fieldname'), ''); // Pass empty string for destination
    }

    // Ensure the directory exists, create it if it doesn't
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => { // Removed explicit type for cb, let TypeScript infer
    // Generate a unique filename to prevent collisions
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // The callback for filename expects (error: Error | null, filename: string)
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
      // When there's an error, the second argument must be 'false'.
    }
  } else if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // When there's an error, the second argument must be 'false'.
    }
  } else {
    // This block runs if the file fieldname is neither 'audio' nor 'image'.
    // When there's an error, the second argument must be 'false'.
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
// RUTA: Obtener todas las canciones disponibles
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

// ====================================================================
// NUEVA RUTA: Obtener una canción por su ID
// Accesible en GET /api/audio/songs/:id
// ====================================================================
router.get('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada.' });
    }
    res.status(200).json(song);
  } catch (error) {
    console.error('Error al obtener canción por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la canción.' });
  }
});

// ====================================================================
// NUEVA RUTA: Obtener la siguiente canción del mismo género
// Accesible en GET /api/audio/songs/next-by-genre/:currentSongId
// ====================================================================
router.get('/songs/next-by-genre/:currentSongId', async (req, res) => {
  try {
    const currentSongId = req.params.currentSongId;
    const currentSong = await Song.findById(currentSongId);

    if (!currentSong) {
      return res.status(404).json({ message: 'Canción actual no encontrada.' });
    }

    const genre = currentSong.genre;

    // Buscar canciones del mismo género, excluyendo la canción actual
    const nextSongs = await Song.find({
      genre: genre,
      _id: { $ne: currentSongId } // Excluir la canción actual
    });

    if (nextSongs.length === 0) {
      return res.status(404).json({ message: 'No hay más canciones del mismo género.' });
    }

    // Devolver una canción aleatoria de la lista de siguientes canciones
    const randomIndex = Math.floor(Math.random() * nextSongs.length);
    res.status(200).json(nextSongs[randomIndex]);

  } catch (error) {
    console.error('Error al obtener la siguiente canción por género:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener la siguiente canción.' });
  }
});


export default router;
