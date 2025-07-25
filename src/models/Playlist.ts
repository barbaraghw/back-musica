// backend/src/models/Playlist.ts
import mongoose, { Document, Schema } from 'mongoose';

// Define la interfaz para el documento de la playlist
export interface IPlaylist extends Document {
  name: string;
  description?: string;
  songs: mongoose.Schema.Types.ObjectId[]; // Array de IDs de canciones
  userId: mongoose.Schema.Types.ObjectId; // ID del usuario/creador de la playlist
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define el esquema de Mongoose para la playlist
const PlaylistSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }], // Referencia al modelo Song
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia al modelo User
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware para actualizar 'updatedAt' en cada guardado
PlaylistSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Crea y exporta el modelo
const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
export default Playlist;
