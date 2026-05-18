/**
 * Módulo principal del Dashboard (index.html).
 * - Carga ofertas desde el backend vía Fetch API
 * - Conecta WebSocket para actualizaciones en tiempo real
 * - Muestra resumen de la plataforma
 */

import { obtenerOfertas, obtenerEstadisticas } from './api/fetchClient.js';
import { connect, on } from './api/socketClient.js';
import { actualizarNavbar, applyRoleVisibility } from './auth/session.js';

document.addEventListener('DOMContentLoaded', () => {
  const contenedorOfertas = document.getElementById('contenedor-ofertas');
  const totalOfertas = document.getElementById('total-ofertas');
  const totalDemandas = document.getElementById('total-demandas');
  const connectionStatus = document.getElementById('connection-status');
  const loading = document.getElementById('loading');

  // Inicializar UI
  actualizarNavbar();
  applyRoleVisibility();

  // Cargar datos iniciales
  cargarDashboard();

  // Conectar WebSocket
  initWebSocket();

  /**
   * Carga las ofertas y estadísticas del dashboard.
   */
  async function cargarDashboard() {
    loading.style.display = 'block';

    try {
      // Cargar ofertas recientes
      const data = await obtenerOfertas({ limit: 6 });
      pintarOfertas(data.obtenerOfertas.offers);

      // Cargar estadísticas
      const stats = await obtenerEstadisticas();
      actualizarResumen(stats.obtenerResumen);
    } catch (error) {
      console.error('Error cargando dashboard:', error.message);
      contenedorOfertas.innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="text-muted">No se pudieron cargar las ofertas. Verifica la conexión al servidor.</p>
        </div>
      `;
    } finally {
      loading.style.display = 'none';
    }
  }

  /**
   * Pinta las tarjetas de ofertas/demandas.
   */
  function pintarOfertas(offers) {
    if (!contenedorOfertas) return;

    if (!offers || offers.length === 0) {
      contenedorOfertas.innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="text-muted">No hay publicaciones todavía.</p>
        </div>
      `;
      return;
    }

    contenedorOfertas.innerHTML = offers.map(offer => {
      const esOferta = offer.type === 'oferta';
      const badgeClass = esOferta ? 'text-bg-primary' : 'text-bg-success';
      const label = esOferta ? 'Oferta' : 'Demanda';
      const fecha = offer.createdAt ? new Date(parseInt(offer.createdAt)).toLocaleDateString('es-ES') : '';

      return `
        <div class="col-md-6 col-xl-4">
          <article class="card dashboard-card h-100 shadow-sm">
            <div class="card-body">
              <span class="small text-uppercase ${esOferta ? 'text-primary' : 'text-success'} fw-semibold d-block mb-2">${label}</span>
              <h3 class="card-title h5">${offer.title}</h3>
              <p class="card-text mb-1"><strong>${offer.company}</strong></p>
              <p class="card-text text-muted small">${offer.location}</p>
              ${fecha ? `<p class="card-text text-muted small">${fecha}</p>` : ''}
              <p class="mt-2 small">${offer.description || 'Sin descripción.'}</p>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <span class="badge rounded-pill ${badgeClass}">${label}</span>
                <span class="badge bg-light text-dark">${offer.category || ''}</span>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join('');
  }

  /**
   * Actualiza el resumen de la plataforma.
   */
  function actualizarResumen(summary) {
    if (!summary) return;

    let ofertas = 0, demandas = 0;
    summary.forEach(s => {
      if (s.type === 'oferta') ofertas = s.activos;
      if (s.type === 'demanda') demandas = s.activos;
    });

    totalOfertas.textContent = ofertas;
    totalDemandas.textContent = demandas;
  }

  /**
   * Inicializa la conexión WebSocket y escucha eventos.
   */
  function initWebSocket() {
    const socket = connect();

    on('connected', () => {
      connectionStatus.innerHTML = '<span class="badge bg-success">🟢 Conectado en tiempo real</span>';
    });

    on('disconnected', () => {
      connectionStatus.innerHTML = '<span class="badge bg-danger">🔴 Desconectado</span>';
    });

    on('error', () => {
      connectionStatus.innerHTML = '<span class="badge bg-warning">⚠️ Error de conexión</span>';
    });

    // Actualizar dashboard cuando se crea/elimina una oferta
    on('offer:created', (data) => {
      console.log('📢 Nueva oferta recibida:', data.offer?.title);
      cargarDashboard(); // Recargar datos
    });

    on('offer:deleted', (data) => {
      console.log('🗑️ Oferta eliminada:', data.title);
      cargarDashboard();
    });
  }
});
