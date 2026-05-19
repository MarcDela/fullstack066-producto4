const mongoose = require('mongoose');

/**
 * Configuración avanzada de conexión Mongoose
 * Incluye: pool de conexiones escalable, eventos de monitoreo,
 * reintentos automáticos y graceful shutdown.
 * @async
 * @returns {Promise<void>}
 */
async function connectDB() {
  const options = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  };

  // Eventos de monitoreo de conexión
  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose conectado a MongoDB Atlas');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión Mongoose:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose desconectado de MongoDB');
  });

  // Graceful shutdown - cierra conexión al detener el proceso
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 Conexión Mongoose cerrada por finalización de la app');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });

  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://lcuevass_db_user:ZyXCPquFe0hI9Dvj@clusterleonardo.epp2vgo.mongodb.net/agrojobsDB?retryWrites=true&w=majority';
    await mongoose.connect(uri, options);
  } catch (error) {
    console.error('❌ Error crítico al conectar con MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
