// backend/src/routes/audioRoutes.ts
import { Router, Request, Response, NextFunction } from 'express'; // Import Request, Response, NextFunction
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Import fs for file system operations
import Song, { ISong } from '../models/Songs'; // Import the Song model (assuming it's defined)
// Importa authenticateJWT desde authMiddleware. No necesitas importar AuthenticatedRequest aquí.
import { authenticateJWT } from '../middleware/authMiddleware';
import { IAuthenticatedUser } from '../interfaces/IAuthenticatedUser'; // Importa IAuthenticatedUser

// NOTA: La interfaz AuthenticatedRequest ya NO se define aquí ni se importa.
// Se maneja a través de la declaración de módulos en backend/src/types/express.d.ts.
// Si necesitas acceder a req.user, simplemente usa 'req.user' y TypeScript lo tipará correctamente.

const router = Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir: string;
    if (file.fieldname === 'audio') {
      uploadDir = path.join(__dirname, '../../uploads/audio');
    } else if (file.fieldname === 'image') {
      uploadDir = path.join(__dirname, '../../uploads/images');
    } else {
      return cb(new Error('Unexpected fieldname'), '');
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
    }
  } else if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
    }
  } else {
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// ====================================================================
// RUTA: Carga de archivos de audio y imagen
// Accesible en POST /api/audio/upload
// ====================================================================
router.post('/upload',
  authenticateJWT, // Usa authenticateJWT
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  // Aquí, el tipo 'req' ya es Express.Request extendido por express.d.ts
  async (req: Request, res) => { // Simplemente usa Request, no AuthenticatedRequest
    const audioFile = (req.files as { [fieldname: string]: Express.Multer.File[] })['audio']?.[0];
    const imageFile = (req.files as { [fieldname: string]: Express.Multer.File[] })['image']?.[0];

    console.log('Backend: req.files:', req.files);
    console.log('Backend: req.body:', req.body);
    console.log('Backend: req.user (from auth):', req.user); // req.user ya está tipado correctamente

    if (!audioFile || !imageFile) {
      return res.status(400).json({ message: 'Se requieren un archivo de audio y una imagen.' });
    }

    const { title, artistGroup, album, genre } = req.body;
    // Obtén userId de req.user, que ahora está tipado por express.d.ts
    // Realiza una aserción de tipo explícita para asegurar que TypeScript vea req.user como IAuthenticatedUser
    const userId = (req.user as IAuthenticatedUser)?._id;

    if (!title || !artistGroup || !album || !genre || !userId) {
      fs.unlink(audioFile.path, (err) => { if (err) console.error('Error deleting audio file:', err); });
      fs.unlink(imageFile.path, (err) => { if (err) console.error('Error deleting image file:', err); });
      return res.status(400).json({ message: 'Faltan metadatos de la canción (título, artista, álbum, género, o userId no encontrado).' });
    }

    try {
      const newSong: ISong = new Song({
        title,
        artistGroup,
        album,
        genre,
        userId,
        audioPath: `/uploads/audio/${audioFile.filename}`,
        imagePath: `/uploads/images/${imageFile.filename}`,
        uploadDate: new Date(),
      });

      await newSong.save();

      console.log(`Audio subido: ${audioFile.filename} por el usuario: ${userId || 'Desconocido'}`);
      console.log(`Imagen subida: ${imageFile.filename} para la canción: ${title || 'Desconocido'}`);
      console.log('Metadatos de la canción guardados en DB:', { title, artistGroup, album, genre });

      res.status(200).json({
        message: 'Archivo de audio e imagen subidos exitosamente y metadatos guardados.',
        songId: newSong._id,
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
    const songs = await Song.find({});
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

// Ruta para obtener géneros únicos
router.get('/genres', authenticateJWT, async (req: Request, res) => { // Simplemente usa Request
  try {
    const genres = await Song.distinct('genre');
    res.json(genres);
  } catch (error: any) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({ message: 'Error al obtener géneros.', error: error.message });
  }
});

// Ruta para obtener artistas únicos
router.get('/artists', authenticateJWT, async (req: Request, res) => { // Simplemente usa Request
  try {
    const artists = await Song.distinct('artistGroup');
    res.json(artists);
  } catch (error: any) {
    console.error('Error al obtener artistas:', error);
    res.status(500).json({ message: 'Error al obtener artistas.', error: error.message });
  }
});

// Ruta para obtener álbumes únicos
router.get('/albums', authenticateJWT, async (req: Request, res) => { // Simplemente usa Request
  try {
    const albums = await Song.distinct('album');
    res.json(albums);
  } catch (error: any) {
    console.error('Error al obtener álbumes:', error);
    res.status(500).json({ message: 'Error al obtener álbumes.', error: error.message });
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
