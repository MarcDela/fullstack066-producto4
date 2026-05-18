/**
 * Módulo de Usuarios (usuarios.html).
 * - Listado de usuarios (solo admin - RBAC)
 * - Eliminación (desactivación) de usuarios
 * - Estadísticas de usuarios
 */

import { obtenerUsuarios, eliminarUsuario, getUserData } from './api/fetchClient.js';
import { actualizarNavbar, isAuthenticated, isAdmin } from './auth/session.js';

document.addEventListener('DOMContentLoaded', () => {
  const contenedorUsuarios = document.getElementById('contenedor-usuarios');
  const accessDenied = document.getElementById('access-denied');
  const roleBadge = document.getElementById('role-badge');
  const totalUsers = document.getElementById('total-users');
  const totalAdmins = document.getElementById('total-admins');
  const totalRegulars = document.getElementById('total-regulars');
  const loading = document.getElementById('loading');

  // Inicializar UI
  actualizarNavbar();

  // Verificar acceso
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  if (!isAdmin()) {
    accessDenied.style.display = 'block';
    contenedorUsuarios.closest('.table-responsive').style.display = 'none';
    return;
  }

  const user = getUserData();
  roleBadge.textContent = `Rol: ${user.role}`;
  roleBadge.classList.add('bg-warning', 'text-dark');

  // Cargar usuarios
  cargarUsuarios();

  /**
   * Carga la lista de usuarios desde el backend.
   */
  async function cargarUsuarios() {
    loading.style.display = 'block';

    try {
      const data = await obtenerUsuarios();
      const usuarios = data.obtenerUsuarios;

      pintarUsuarios(usuarios);
      actualizarEstadisticas(usuarios);
    } catch (error) {
      console.error('Error cargando usuarios:', error.message);
      contenedorUsuarios.innerHTML = `
        <tr><td colspan="7" class="text-center text-danger">Error: ${error.message}</td></tr>
      `;
    } finally {
      loading.style.display = 'none';
    }
  }

  /**
   * Pinta la tabla de usuarios.
   */
  function pintarUsuarios(usuarios) {
    if (!contenedorUsuarios) return;

    if (!usuarios || usuarios.length === 0) {
      contenedorUsuarios.innerHTML = `
        <tr><td colspan="7" class="text-center text-muted">No hay usuarios registrados.</td></tr>
      `;
      return;
    }

    const currentUser = getUserData();

    contenedorUsuarios.innerHTML = usuarios.map(u => {
      const roleBadge = u.role === 'admin' 
        ? '<span class="badge bg-warning text-dark">Admin</span>'
        : '<span class="badge bg-info">User</span>';

      const statusBadge = u.isActive 
        ? '<span class="badge bg-success">Activo</span>'
        : '<span class="badge bg-secondary">Inactivo</span>';

      const lastLogin = u.lastLogin 
        ? new Date(parseInt(u.lastLogin)).toLocaleDateString('es-ES')
        : 'Nunca';

      const createdAt = u.createdAt 
        ? new Date(parseInt(u.createdAt)).toLocaleDateString('es-ES')
        : '-';

      // No permitir eliminar al propio usuario
      const isSelf = currentUser && currentUser.id === u.id;
      const deleteBtn = isSelf 
        ? '<span class="text-muted small">Tú</span>'
        : `<button class="btn btn-outline-danger btn-sm btn-eliminar-usuario" data-id="${u.id}" data-username="${u.username}">Desactivar</button>`;

      return `
        <tr>
          <td><strong>${u.username}</strong></td>
          <td>${u.email}</td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td>${lastLogin}</td>
          <td>${createdAt}</td>
          <td class="text-end">${deleteBtn}</td>
        </tr>
      `;
    }).join('');

    // Registrar eventos de eliminar
    document.querySelectorAll('.btn-eliminar-usuario').forEach(btn => {
      btn.addEventListener('click', () => handleEliminar(btn.dataset.id, btn.dataset.username));
    });
  }

  /**
   * Actualiza las estadísticas de usuarios.
   */
  function actualizarEstadisticas(usuarios) {
    const admins = usuarios.filter(u => u.role === 'admin').length;
    const regulars = usuarios.filter(u => u.role === 'user').length;

    totalUsers.textContent = usuarios.length;
    totalAdmins.textContent = admins;
    totalRegulars.textContent = regulars;
  }

  /**
   * Handler para desactivar un usuario.
   */
  async function handleEliminar(id, username) {
    if (!confirm(`¿Desactivar al usuario "${username}"? Podrá reactivarse después.`)) return;

    try {
      await eliminarUsuario(id);
      cargarUsuarios();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
});
