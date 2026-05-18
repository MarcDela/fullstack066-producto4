const { Server } = require('socket.io');
const { verifyToken } = require('../middleware/auth');

/**
 * Configuración de Socket.io con autenticación JWT,
 * canales multiplexados y patrón PUB/SUB para notificaciones en tiempo real.
 * 
 * Canales (namespaces/rooms):
 * - /offers: Notificaciones de ofertas/demandas (público)
 * - /admin: Canal exclusivo para administradores
 * - /notifications: Notificaciones personales del usuario
 * 
 * Eventos emitidos:
 * - offer:created - Nueva oferta creada
 * - offer:updated - Oferta actualizada
 * - offer:deleted - Oferta eliminada
 * - user:connected - Usuario conectado (admin)
 * - user:disconnected - Usuario desconectado (admin)
 * - notification - Notificación personal
 */

/**
 * Inicializa Socket.io con autenticación y canales.
 * @param {http.Server|https.Server} server - Servidor HTTP/HTTPS
 * @returns {Server} Instancia de Socket.io configurada
 */
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    // Reducción de tráfico: configuración de transporte
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    // Compresión para reducir ancho de banda
    perMessageDeflate: {
      threshold: 1024 // Solo comprimir mensajes > 1KB
    }
  });

  // ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
  
  /**
   * Middleware que verifica el token JWT en la conexión WebSocket.
   * El token se envía como query parameter o en auth.
   */
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      // Permitir conexión sin auth para canal público (solo lectura)
      socket.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Token inválido o expirado'));
    }

    socket.user = decoded;
    next();
  });

  // ==================== CONEXIÓN PRINCIPAL ====================

  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user ? user.id : 'anonymous';
    const username = user ? user.username : 'Anónimo';

    console.log(`🔌 Socket conectado: ${username} (${socket.id})`);

    // Unir al usuario a su room personal (para notificaciones directas)
    if (user) {
      socket.join(`user:${userId}`);
      socket.join('authenticated');

      // Si es admin, unir al canal de administración
      if (user.role === 'admin') {
        socket.join('admin');
        // Notificar a otros admins
        socket.to('admin').emit('user:connected', {
          username: user.username,
          role: user.role,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Todos se unen al canal público de ofertas
    socket.join('offers');

    // ==================== EVENTOS DEL CLIENTE ====================

    /**
     * Cliente solicita unirse a un canal específico (categoría de ofertas)
     */
    socket.on('join:channel', (channel) => {
      const allowedChannels = ['agricultura', 'tecnologia', 'hogar', 'vehiculos', 'servicios', 'otros'];
      
      if (allowedChannels.includes(channel)) {
        socket.join(`category:${channel}`);
        socket.emit('channel:joined', { channel, message: `Unido al canal ${channel}` });
        console.log(`📡 ${username} se unió al canal: ${channel}`);
      }
    });

    /**
     * Cliente solicita salir de un canal
     */
    socket.on('leave:channel', (channel) => {
      socket.leave(`category:${channel}`);
      socket.emit('channel:left', { channel });
    });

    /**
     * Ping para mantener conexión activa (heartbeat personalizado)
     */
    socket.on('ping:custom', () => {
      socket.emit('pong:custom', { timestamp: Date.now() });
    });

    // ==================== DESCONEXIÓN ====================

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${username} (${reason})`);

      if (user && user.role === 'admin') {
        socket.to('admin').emit('user:disconnected', {
          username: user.username,
          timestamp: new Date().toISOString()
        });
      }
    });

    // ==================== MANEJO DE ERRORES ====================

    socket.on('error', (error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error.message);
    });
  });

  return io;
}

/**
 * Emite un evento de nueva oferta a todos los clientes relevantes.
 * Implementa patrón PUB/SUB con canales multiplexados.
 * 
 * @param {Server} io - Instancia de Socket.io
 * @param {Object} offer - Oferta creada
 */
function emitOfferCreated(io, offer) {
  // Emitir a todos en el canal de ofertas
  io.to('offers').emit('offer:created', {
    offer,
    timestamp: new Date().toISOString()
  });

  // Emitir al canal de categoría específica
  if (offer.category) {
    io.to(`category:${offer.category}`).emit('offer:created:category', {
      offer,
      category: offer.category
    });
  }

  // Notificar a admins
  io.to('admin').emit('admin:new_offer', {
    message: `Nueva ${offer.type}: "${offer.title}"`,
    offer
  });
}

/**
 * Emite un evento de oferta actualizada.
 * @param {Server} io - Instancia de Socket.io
 * @param {Object} offer - Oferta actualizada
 */
function emitOfferUpdated(io, offer) {
  io.to('offers').emit('offer:updated', {
    offer,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emite un evento de oferta eliminada.
 * @param {Server} io - Instancia de Socket.io
 * @param {String} offerId - ID de la oferta eliminada
 * @param {String} title - Título de la oferta
 */
function emitOfferDeleted(io, offerId, title) {
  io.to('offers').emit('offer:deleted', {
    offerId,
    title,
    timestamp: new Date().toISOString()
  });
}

/**
 * Envía una notificación personal a un usuario específico.
 * @param {Server} io - Instancia de Socket.io
 * @param {String} userId - ID del usuario destinatario
 * @param {Object} notification - Datos de la notificación
 */
function sendNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initializeSocket,
  emitOfferCreated,
  emitOfferUpdated,
  emitOfferDeleted,
  sendNotification
};
