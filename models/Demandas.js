const mongoose = require('mongoose');

const demandaSchema = new mongoose.Schema({
    
    nombre: { type: String, required: true },        
    profesion: { type: String, required: true },     
    disponibilidad: { type: String, required: true }, 
    descripcion: { type: String, required: true },
    fecha: { type: String, required: true },

    // Guardamos qué usuario creó la oferta para el control de acceso
    autorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario' 
    }
});

module.exports = mongoose.model('Demanda', demandaSchema);