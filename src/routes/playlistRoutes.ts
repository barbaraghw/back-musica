// backend/src/routes/playlistRoutes.ts
import { Router, Request, Response } from 'express';
// Importa solo authenticateJWT, ya que AuthenticatedRequest se maneja globalmente
import { authenticateJWT } from '../middleware/authMiddleware';
import Playlist, { IPlaylist } from '../models/Playlist';
import Song from '../models/Songs'; // Para poblar los detalles de las canciones

const router = Router();

// NOTA: Gracias a la declaración global en backend/src/types/express.d.ts,
// 'req.user' estará disponible y tipado como IAuthenticatedUser
// después de 'authenticateJWT'. No necesitamos importar AuthenticatedRequest aquí.

// ====================================================================
// RUTA: Obtener todas las playlists (filtradas por usuario o públicas)
// Accesible en GET /api/playlists?filter=my o /api/playlists?filter=public
// ====================================================================
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // req.user ahora es de tipo IAuthenticatedUser debido a la declaración global
    const userId = req.user?._id; // ID del usuario autenticado
    const filter = req.query.filter as string; // 'my' o 'public'

    let query: any = {};

    if (filter === 'my') {
      if (!userId) {
        return res.status(401).json({ message: 'Se requiere autenticación para ver tus playlists.' });
      }
      query.userId = userId; // Filtra por el ID del usuario actual
    } else if (filter === 'public') {
      query.isPublic = true; // Filtra por playlists públicas
    } else {
      // Si el filtro no es válido o no se proporciona, por defecto muestra las playlists del usuario
      // o puedes decidir mostrar todas las públicas si no hay usuario autenticado.
      if (!userId) {
        return res.status(401).json({ message: 'Se requiere autenticación para ver playlists.' });
      }
      query.userId = userId;
    }

    // Encuentra las playlists y popula los detalles de las canciones
    const playlists = await Playlist.find(query).populate('songs');
    res.status(200).json(playlists);
  } catch (error: any) {
    console.error('Error al obtener playlists:', error);
    res.status(500).json({ message: 'Error al obtener playlists.', error: error.message });
  }
});

// ====================================================================
// RUTA: Obtener una playlist por su ID
// Accesible en GET /api/playlists/:id
// ====================================================================
router.get('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user?._id; // ID del usuario autenticado

    // Encuentra la playlist y popula los detalles de las canciones
    const playlist = await Playlist.findById(playlistId).populate('songs');

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist no encontrada.' });
    }

    // Verifica la propiedad o el estado público de la playlist
    // Si no es pública Y el usuario no es el creador, deniega el acceso
    if (!playlist.isPublic && playlist.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Acceso denegado. Esta playlist es privada.' });
    }

    res.status(200).json(playlist);
  } catch (error: any) {
    console.error('Error al obtener playlist por ID:', error);
    res.status(500).json({ message: 'Error al obtener playlist.', error: error.message });
  }
});

// ====================================================================
// RUTA: Crear una nueva playlist
// Accesible en POST /api/playlists
// ====================================================================
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { name, description, isPublic, songs } = req.body;
    const userId = req.user?._id; // Obtiene el ID del usuario autenticado desde el token

    if (!userId) {
      return res.status(401).json({ message: 'Se requiere autenticación para crear una playlist.' });
    }
    if (!name) {
      return res.status(400).json({ message: 'El nombre de la playlist es requerido.' });
    }

    const newPlaylist: IPlaylist = new Playlist({
      name,
      description,
      songs: songs || [], // Asegura que 'songs' sea un array (puede estar vacío inicialmente)
      userId,
      isPublic: isPublic || false, // Por defecto es privada si no se especifica
    });

    await newPlaylist.save();
    res.status(201).json({ message: 'Playlist creada exitosamente.', playlist: newPlaylist });
  } catch (error: any) {
    console.error('Error al crear playlist:', error);
    res.status(500).json({ message: 'Error al crear playlist.', error: error.message });
  }
});

// ====================================================================
// RUTA: Actualizar una playlist existente
// Accesible en PUT /api/playlists/:id
// ====================================================================
router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user?._id; // ID del usuario autenticado
    const { name, description, isPublic, songs } = req.body; // 'songs' será un array de IDs de canciones

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist no encontrada.' });
    }

    // Solo el creador de la playlist puede actualizarla
    if (playlist.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Acceso denegado. Solo puedes editar tus propias playlists.' });
    }

    // Actualiza los campos
    playlist.name = name || playlist.name;
    playlist.description = description !== undefined ? description : playlist.description;
    playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;
    playlist.songs = songs !== undefined ? songs : playlist.songs; // Actualiza el array de IDs de canciones

    await playlist.save(); // Guarda los cambios
    res.status(200).json({ message: 'Playlist actualizada exitosamente.', playlist });
  } catch (error: any) {
    console.error('Error al actualizar playlist:', error);
    res.status(500).json({ message: 'Error al actualizar playlist.', error: error.message });
  }
});

// ====================================================================
// RUTA: Eliminar una playlist
// Accesible en DELETE /api/playlists/:id
// ====================================================================
router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const playlistId = req.params.id;
    const userId = req.user?._id; // ID del usuario autenticado

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist no encontrada.' });
    }

    // Solo el creador de la playlist puede eliminarla
    if (playlist.userId.toString() !== userId?.toString()) {
      return res.status(403).json({ message: 'Acceso denegado. Solo puedes eliminar tus propias playlists.' });
    }

    await playlist.deleteOne(); // Elimina la playlist
    res.status(200).json({ message: 'Playlist eliminada exitosamente.' });
  } catch (error: any) {
    console.error('Error al eliminar playlist:', error);
    res.status(500).json({ message: 'Error al eliminar playlist.', error: error.message });
  }
});

export default router;
