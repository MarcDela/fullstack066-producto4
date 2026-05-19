const mongoose = require('mongoose');

const DemandaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  profesion: { type: String, required: true, trim: true },
  disponibilidad: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Demanda', DemandaSchema);
