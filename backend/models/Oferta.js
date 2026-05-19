const mongoose = require('mongoose');

const OfertaSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  empresa: { type: String, required: true, trim: true },
  ubicacion: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  salario: { type: Number, default: 0 },
  creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Oferta', OfertaSchema);
