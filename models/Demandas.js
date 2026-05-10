const mongoose = require('mongoose');

const obtenerFechaActual = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `${dia}/${mes}/${anio}`;
};

const demandaSchema = new mongoose.Schema({
    
    nombre: { type: String, required: true },        
    profesion: { type: String, required: true },     
    disponibilidad: { type: String, required: true }, 
    descripcion: { type: String, required: true },
    fecha: { type: String, default: obtenerFechaActual },

    // Guardamos qué usuario creó la oferta para el control de acceso
    autorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario' 
    }
});

module.exports = mongoose.model('Demanda', demandaSchema);