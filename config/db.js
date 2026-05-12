require('dotenv').config();

const mongoose = require('mongoose');

/**
 * CONFIGURACIÓN DE MONGO ATLAS
 */
const uri = process.env.MONGODB_URL;

/**
 * Conecta a MongoDB Atlas usando la biblioteca Mongoose.
 * Mongoose gestiona internamente el pool de conexiones, por lo que 
 * no necesitamos cachear la variable 'db' manualmente como hacíamos antes.
 */
const conectarDB = async () => {
    try {
        // Conexión simplificada. Mongoose usa por defecto las mejores opciones para Atlas.
        await mongoose.connect(uri);
        console.log('✅ Conexión exitosa a MongoDB Atlas vía Mongoose');
        
    } catch (error) {
        console.error('❌ Error crítico: No se pudo conectar con Mongoose.');
        console.error('Detalles:', error.message);
        
        // Mantenemos el cierre del proceso si falla la conexión inicial
        process.exit(1);
    }
};

module.exports = conectarDB;