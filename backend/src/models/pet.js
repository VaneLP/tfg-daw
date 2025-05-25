import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  refugioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  especie: {
    type: String,
    required: true,
    trim: true
  },
  raza: {
    type: String,
    trim: true
  },
  edad: {
    type: String,
    trim: true
  },
  genero: {
    type: String,
    required: true,
    enum: ['Macho', 'Hembra']
  },
  tamano: {
    type: String,
    enum: ['Pequeño', 'Mediano', 'Grande'],
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  fotos: [{
    type: String
  }],
  estadoAdopcion: {
    type: String,
    required: true,
    enum: ['Disponible', 'Pendiente', 'Adoptado'],
    default: 'Disponible'
  },
  fechaPublicacion: {
    type: Date,
    default: Date.now
  },
}, { timestamps: true });



const Pet = mongoose.model('Pet', petSchema);
export default Pet;