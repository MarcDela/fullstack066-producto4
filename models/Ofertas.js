const mongoose = require('mongoose');

const obtenerFechaActual = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `${dia}/${mes}/${anio}`;
};

const ofertaSchema = new mongoose.Schema({
    
    titulo: { type: String, required: true },
    empresa: { type: String, required: true },
    ubicacion: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: String, default: obtenerFechaActual }, 

    // Guardamos qué usuario creó la oferta para el control de acceso
    autorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario' 
    }
});

module.exports = mongoose.model('Oferta', ofertaSchema);