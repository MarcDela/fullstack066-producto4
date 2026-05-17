const mongoose = require('mongoose');

const empleoSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    profesion: {type: String, required: true},
    disponibilidad: {type: String, required: true},
    descripcion: {type: String, required: true},
    fecha: {type: String, required: true}
});

module.exports = mongoose.model('empleo', empleoSchema);