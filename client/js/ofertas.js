/**
 * Módulo de Ofertas (ofertas.html).
 * - CRUD de ofertas/demandas vía Fetch API con JWT
 * - Filtros y paginación
 * - Notificaciones en tiempo real con WebSocket
 */

import { obtenerOfertas, crearOferta, eliminarOferta, getUserData } from './api/fetchClient.js';
import { connect, on } from './api/socketClient.js';
import { actualizarNavbar, isAuthenticated, applyRoleVisibility } from './auth/session.js';

document.addEventListener('DOMContentLoaded', () => {
  const contenedorOfertas = document.getElementById('contenedor-ofertas');
  const formOferta = document.getElementById('form-oferta');
  const mensajeOferta = document.getElementById('mensaje-oferta');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const paginacion = document.getElementById('paginacion');
  const loading = document.getElementById('loading');

  let currentPage = 1;
  const LIMIT = 9;

  // Inicializar UI
  actualizarNavbar();
  applyRoleVisibility();

  // Cargar ofertas
  cargarOfertas();

  // Conectar WebSocket
  initWebSocket();

  // Eventos de filtros
  if (filtroTipo) filtroTipo.addEventListener('change', () => { currentPage = 1; cargarOfertas(); });
  if (filtroCategoria) filtroCategoria.addEventListener('change', () => { currentPage = 1; cargarOfertas(); });

  // Evento de crear oferta
  if (formOferta) formOferta.addEventListener('submit', handleCrearOferta);

  /**
   * Carga ofertas con filtros y paginación.
   */
  async function cargarOfertas() {
    loading.style.display = 'block';

    try {
      const filters = {
        page: currentPage,
        limit: LIMIT
      };

      if (filtroTipo && filtroTipo.value) filters.type = filtroTipo.value;
      if (filtroCategoria && filtroCategoria.value) filters.category = filtroCategoria.value;

      const data = await obtenerOfertas(filters);
      const result = data.obtenerOfertas;

      pintarOfertas(result.offers);
      pintarPaginacion(result);
    } catch (error) {
      console.error('Error cargando ofertas:', error.message);
      contenedorOfertas.innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="text-danger">Error: ${error.message}</p>
        </div>
      `;
    } finally {
      loading.style.display = 'none';
    }
  }

  /**
   * Pinta las tarjetas de ofertas.
   */
  function pintarOfertas(offers) {
    if (!contenedorOfertas) return;

    if (!offers || offers.length === 0) {
      contenedorOfertas.innerHTML = `
        <div class="col-12 text-center py-4">
          <p class="text-muted">No hay publicaciones con estos filtros.</p>
        </div>
      `;
      return;
    }

    const user = getUserData();

    contenedorOfertas.innerHTML = offers.map(offer => {
      const esOferta = offer.type === 'oferta';
      const badgeClass = esOferta ? 'text-bg-primary' : 'text-bg-success';
      const label = esOferta ? 'Oferta' : 'Demanda';
      const fecha = offer.createdAt ? new Date(parseInt(offer.createdAt)).toLocaleDateString('es-ES') : '';

      // Mostrar botón eliminar solo si es propietario o admin
      const canDelete = user && (user.role === 'admin' || (offer.userId && offer.userId.id === user.id));
      const deleteBtn = canDelete 
        ? `<button class="btn btn-outline-danger btn-sm btn-eliminar" data-id="${offer.id}">Eliminar</button>`
        : '';

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
                <div>
                  <span class="badge rounded-pill ${badgeClass}">${label}</span>
                  <span class="badge bg-light text-dark ms-1">${offer.category || ''}</span>
                </div>
                ${deleteBtn}
              </div>
              ${offer.userId ? `<p class="text-muted small mt-2 mb-0">Por: ${offer.userId.username}</p>` : ''}
            </div>
          </article>
        </div>
      `;
    }).join('');

    // Registrar eventos de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => handleEliminar(btn.dataset.id));
    });
  }

  /**
   * Pinta la paginación.
   */
  function pintarPaginacion(result) {
    if (!paginacion) return;

    if (result.totalPages <= 1) {
      paginacion.innerHTML = '';
      return;
    }

    let html = '<ul class="pagination">';
    
    html += `<li class="page-item ${!result.hasPrev ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
    </li>`;

    for (let i = 1; i <= result.totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
    }

    html += `<li class="page-item ${!result.hasNext ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
    </li>`;

    html += '</ul>';
    paginacion.innerHTML = html;

    // Eventos de paginación
    paginacion.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        if (page >= 1 && page <= result.totalPages) {
          currentPage = page;
          cargarOfertas();
        }
      });
    });
  }

  /**
   * Handler para crear una oferta.
   */
  async function handleCrearOferta(e) {
    e.preventDefault();

    const title = document.getElementById('titulo').value.trim();
    const company = document.getElementById('empresa').value.trim();
    const location = document.getElementById('ubicacion').value.trim();
    const description = document.getElementById('descripcion').value.trim();
    const type = document.getElementById('tipo').value;
    const category = document.getElementById('categoria').value;

    if (!title || !company || !location || !type) {
      mostrarMensaje('Rellena todos los campos obligatorios.', 'error');
      return;
    }

    try {
      await crearOferta({ title, company, location, description, type, category });
      mostrarMensaje('Publicación creada correctamente.', 'ok');
      formOferta.reset();
      cargarOfertas();
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    }
  }

  /**
   * Handler para eliminar una oferta.
   */
  async function handleEliminar(id) {
    if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
      await eliminarOferta(id);
      mostrarMensaje('Publicación eliminada.', 'ok');
      cargarOfertas();
    } catch (error) {
      mostrarMensaje(error.message, 'error');
    }
  }

  /**
   * Muestra un mensaje.
   */
  function mostrarMensaje(texto, tipo) {
    if (!mensajeOferta) return;
    mensajeOferta.textContent = texto;
    mensajeOferta.className = 'mt-3';
    mensajeOferta.classList.add(tipo === 'error' ? 'mensaje-error' : 'mensaje-ok');
    setTimeout(() => { mensajeOferta.textContent = ''; }, 4000);
  }

  /**
   * Inicializa WebSocket para actualizaciones en tiempo real.
   */
  function initWebSocket() {
    connect();

    on('offer:created', () => {
      cargarOfertas();
    });

    on('offer:deleted', () => {
      cargarOfertas();
    });

    on('offer:updated', () => {
      cargarOfertas();
    });
  }
});
