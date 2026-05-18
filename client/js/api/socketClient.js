/**
 * Cliente Socket.io con:
 * - Autenticación JWT en la conexión
 * - Suscripción a canales multiplexados (categorías)
 * - Reconexión automática
 * - Reducción de tráfico con throttling
 * - Patrón PUB/SUB para notificaciones en tiempo real
 * 
 * @module socketClient
 */

import { getToken } from './fetchClient.js';

let socket = null;
let isConnected = false;

// Listeners registrados por el usuario
const eventListeners = new Map();

// Throttle para evitar exceso de actualizaciones en UI
let lastUIUpdate = 0;
const UI_UPDATE_THROTTLE = 500; // ms mínimo entre actualizaciones de UI

/**
 * Conecta al servidor WebSocket con autenticación JWT.
 * Si ya hay una conexión activa, la reutiliza.
 * 
 * @returns {Object} Instancia del socket
 */
function connect() {
  if (socket && isConnected) {
    console.log('🔌 Socket ya conectado, reutilizando...');
    return socket;
  }

  const token = getToken();
  const serverUrl = window.location.origin;

  // Cargar socket.io-client desde CDN si no está disponible
  if (typeof io === 'undefined') {
    console.error('❌ Socket.io client no cargado. Asegúrate de incluir el script.');
    return null;
  }

  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });

  // ==================== EVENTOS DE CONEXIÓN ====================

  socket.on('connect', () => {
    isConnected = true;
    console.log('✅ WebSocket conectado:', socket.id);
    triggerEvent('connected', { socketId: socket.id });
  });

  socket.on('disconnect', (reason) => {
    isConnected = false;
    console.log('⚠️ WebSocket desconectado:', reason);
    triggerEvent('disconnected', { reason });
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión WebSocket:', error.message);
    triggerEvent('error', { message: error.message });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
    triggerEvent('reconnected', { attempts: attemptNumber });
  });

  // ==================== EVENTOS DE OFERTAS (PUB/SUB) ====================

  socket.on('offer:created', (data) => {
    if (shouldUpdateUI()) {
      triggerEvent('offer:created', data);
    }
  });

  socket.on('offer:updated', (data) => {
    if (shouldUpdateUI()) {
      triggerEvent('offer:updated', data);
    }
  });

  socket.on('offer:deleted', (data) => {
    if (shouldUpdateUI()) {
      triggerEvent('offer:deleted', data);
    }
  });

  // Eventos de categoría específica
  socket.on('offer:created:category', (data) => {
    triggerEvent('offer:created:category', data);
  });

  // ==================== EVENTOS DE ADMIN ====================

  socket.on('admin:new_offer', (data) => {
    triggerEvent('admin:new_offer', data);
  });

  socket.on('user:connected', (data) => {
    triggerEvent('user:connected', data);
  });

  socket.on('user:disconnected', (data) => {
    triggerEvent('user:disconnected', data);
  });

  // ==================== NOTIFICACIONES PERSONALES ====================

  socket.on('notification', (data) => {
    triggerEvent('notification', data);
    showNotification(data);
  });

  // ==================== CANAL CONFIRMACIONES ====================

  socket.on('channel:joined', (data) => {
    console.log(`📡 Canal unido: ${data.channel}`);
    triggerEvent('channel:joined', data);
  });

  socket.on('channel:left', (data) => {
    console.log(`📡 Canal abandonado: ${data.channel}`);
  });

  return socket;
}

/**
 * Desconecta del servidor WebSocket.
 */
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('🔌 WebSocket desconectado manualmente');
  }
}

/**
 * Suscribe a un canal de categoría específica.
 * @param {String} channel - Nombre del canal (categoría)
 */
function joinChannel(channel) {
  if (socket && isConnected) {
    socket.emit('join:channel', channel);
  }
}

/**
 * Abandona un canal de categoría.
 * @param {String} channel - Nombre del canal
 */
function leaveChannel(channel) {
  if (socket && isConnected) {
    socket.emit('leave:channel', channel);
  }
}

// ==================== SISTEMA DE EVENTOS (PUB/SUB LOCAL) ====================

/**
 * Registra un listener para un evento.
 * @param {String} event - Nombre del evento
 * @param {Function} callback - Función a ejecutar
 */
function on(event, callback) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  eventListeners.get(event).push(callback);
}

/**
 * Elimina un listener de un evento.
 * @param {String} event - Nombre del evento
 * @param {Function} callback - Función a eliminar
 */
function off(event, callback) {
  if (eventListeners.has(event)) {
    const listeners = eventListeners.get(event).filter(cb => cb !== callback);
    eventListeners.set(event, listeners);
  }
}

/**
 * Dispara un evento a todos los listeners registrados.
 * @param {String} event - Nombre del evento
 * @param {Object} data - Datos del evento
 */
function triggerEvent(event, data) {
  if (eventListeners.has(event)) {
    eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en listener de "${event}":`, error);
      }
    });
  }
}

// ==================== UTILIDADES ====================

/**
 * Throttle para actualizaciones de UI.
 * Evita refrescar la interfaz demasiado frecuentemente.
 * @returns {Boolean} true si se puede actualizar
 */
function shouldUpdateUI() {
  const now = Date.now();
  if (now - lastUIUpdate > UI_UPDATE_THROTTLE) {
    lastUIUpdate = now;
    return true;
  }
  return false;
}

/**
 * Muestra una notificación visual al usuario.
 * @param {Object} notification - Datos de la notificación
 */
function showNotification(notification) {
  // Crear toast de Bootstrap si existe el contenedor
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">🔔 ${notification.title || 'Notificación'}</strong>
      <small>${new Date().toLocaleTimeString()}</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">${notification.message || ''}</div>
  `;

  container.appendChild(toast);

  // Auto-eliminar después de 5 segundos
  setTimeout(() => toast.remove(), 5000);
}

/**
 * Verifica si el socket está conectado.
 * @returns {Boolean}
 */
function getConnectionStatus() {
  return isConnected;
}

export {
  connect,
  disconnect,
  joinChannel,
  leaveChannel,
  on,
  off,
  getConnectionStatus
};
