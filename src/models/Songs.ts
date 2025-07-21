import mongoose, { Document, Schema } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artistGroup: string;
  album: string;
  genre: string;
  userId: string; // ID del autor que subió la canción
  audioPath: string; // Ruta al archivo de audio en el servidor (ej. /uploads/audio/audio-12345.mp3)
  imagePath: string; // Ruta a la imagen del álbum en el servidor (ej. /uploads/images/image-12345.jpg)
  uploadDate: Date;
}

const SongSchema: Schema = new Schema({
  title: { type: String, required: true },
  artistGroup: { type: String, required: true },
  album: { type: String, required: true },
  genre: { type: String, required: true },
  userId: { type: String, required: true }, // Referencia al usuario que subió
  audioPath: { type: String, required: true },
  imagePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
});

export default mongoose.model<ISong>('Song', SongSchema);
