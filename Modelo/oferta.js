const mongoose = require('mongoose');

const ofertaSchema = new mongoose.Schema({
    titulo: {type: String, required: true},
    empresa: {type: String, required: true},
    ubicacion: {type: String, required: true},
    descripcion: {type: String, required: true},
    fecha: {type: String, required: true}
});

module.exports = mongoose.model('oferta', ofertaSchema);