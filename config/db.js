/**
 * CONFIGURACIÓN DE MONGODB ATLAS CON MONGOOSE
 * Lectura de la URL desde el archivo .env
 */
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URL;

/**
 * Conecta a MongoDB Atlas usando Mongoose y la BBDD. 
 * @returns {Promise<typeof mongoose>}
 */
async function conectarDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    try {
        // Mongoose se conecta automáticamente a la base de datos (URL del .env)
        await mongoose.connect(uri);
        
        console.log('✅ Conexión exitosa a MongoDB Atlas mediante Mongoose (Cloud: Tu BBDD Personal)');
        return mongoose;
    } catch (error) {
        console.error('❌ Error crítico: No se pudo conectar a MongoDB Atlas con Mongoose.');
        console.error('Detalles del error:', error.message);
        console.error('Error de conexión: \n1. ¿IP configurada en "Network Access" de tu cuenta de Mongo Atlas? \n2. ¿URL del archivo .env correcta?');
        process.exit(1);
    }
}

module.exports = conectarDB;