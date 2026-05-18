const { MongoClient, ServerApiVersion } = require('mongodb');

/**
 * CONFIGURACIÓN DE MONGO ATLAS
 * Sustituimos localhost por la cadena de conexión de ClusterMarc
 */
const uri = process.env.MONGODB_URL;
const dbName = 'agrojobsDB';

// Creamos el cliente con configuración recomendada para Atlas
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db; // Variable para cachear la conexión

/**
 * Conecta a MongoDB Atlas y devuelve la instancia de la base de datos.
 * @returns {Promise<Db>}
 */
async function conectarDB() {
    if (db) return db; // Si ya estamos conectados, devolvemos la conexión actual

    try {
        await client.connect();
        
        // Verificamos la conexión (haciendo un ping)
        await client.db("admin").command({ ping: 1 });
        
        console.log('✅ Conexión exitosa a MongoDB Atlas (Cloud: ClusterMarc)');
        
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('❌ Error crítico: No se pudo conectar a MongoDB Atlas.');
        console.error('Detalles del error:', error.message);
        console.error('Error de conexión: \n1. ¿IP configurada en "Network Access"? \n2. ¿Usuario/Password correctos?');
        process.exit(1);
    }
}

module.exports = conectarDB;