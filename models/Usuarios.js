const mongoose = require('mongoose');

/**
 * 1. Definimos el SCHEMA 
 * Es el "plano" o la plantilla que dice qué campos son obligatorios
 * y qué tipo de datos aceptamos (String, Number, etc.).
 */
const usuarioSchema = new mongoose.Schema({

    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // 2. ROL: Implementamos el sistema de roles
    // Usamos 'enum' para limitar las opciones
    rol: { 
        type: String, 
        enum: ['Administrador', 'Empresa', 'Candidato'], 
        default: 'Candidato' 
    }
});

/**
 * 3. Exportamos el MODELO.
 * El modelo es el objeto que usaremos en los resolvers para hacer Usuario.find() o Usuario.create(). 
 * Mongoose creará automáticamente una colección llamada 'usuarios' en Atlas.
 */
module.exports = mongoose.model('Usuario', usuarioSchema);