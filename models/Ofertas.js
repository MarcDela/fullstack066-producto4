const mongoose = require('mongoose');

const ofertaSchema = new mongoose.Schema({
    
    titulo: { type: String, required: true },
    empresa: { type: String, required: true },
    ubicacion: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: String, required: true }, 

    // Guardamos qué usuario creó la oferta para el control de acceso
    autorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario' 
    }
});

module.exports = mongoose.model('Oferta', ofertaSchema);