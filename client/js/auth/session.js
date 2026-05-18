/**
 * Módulo de gestión de sesión del usuario.
 * Centraliza la lógica de autenticación en el frontend:
 * - Verificación de sesión activa
 * - Actualización de navbar según estado de login
 * - Protección de rutas (redirección si no autenticado)
 * - Gestión de roles en la UI
 * 
 * @module session
 */

import { getToken, getUserData, removeToken, logout } from '../api/fetchClient.js';

/**
 * Verifica si hay una sesión activa (token válido en storage).
 * @returns {Boolean} true si el usuario está autenticado
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Obtiene el rol del usuario actual.
 * @returns {String|null} 'admin', 'user' o null
 */
function getCurrentRole() {
  const user = getUserData();
  return user ? user.role : null;
}

/**
 * Verifica si el usuario actual es administrador.
 * @returns {Boolean}
 */
function isAdmin() {
  return getCurrentRole() === 'admin';
}

/**
 * Actualiza la navbar según el estado de sesión.
 * Muestra el nombre del usuario y botón de logout si está autenticado,
 * o el enlace de login si no lo está.
 */
function actualizarNavbar() {
  const zonaSesion = document.getElementById('zona-sesion');
  if (!zonaSesion) return;

  if (isAuthenticated()) {
    const user = getUserData();
    const rolBadge = user.role === 'admin' 
      ? '<span class="badge bg-warning text-dark ms-2">Admin</span>' 
      : '';

    zonaSesion.innerHTML = `
      <span class="nav-link mb-0">
        ${user.username || user.email}${rolBadge}
      </span>
      <button id="btn-logout" class="btn btn-outline-light btn-sm ms-lg-2 mt-2 mt-lg-0" type="button">
        Cerrar sesión
      </button>
    `;

    const botonLogout = document.getElementById('btn-logout');
    if (botonLogout) {
      botonLogout.onclick = () => {
        logout();
      };
    }
  } else {
    zonaSesion.innerHTML = `
      <a class="nav-link" href="login.html">Login</a>
    `;
  }
}

/**
 * Protege una página: redirige a login si no hay sesión activa.
 * Usar al inicio de páginas que requieren autenticación.
 * @param {String} [redirectTo='login.html'] - URL de redirección
 */
function requireLogin(redirectTo = 'login.html') {
  if (!isAuthenticated()) {
    window.location.href = redirectTo;
  }
}

/**
 * Protege una página: redirige si el usuario no es admin.
 * @param {String} [redirectTo='index.html'] - URL de redirección
 */
function requireAdmin(redirectTo = 'index.html') {
  if (!isAuthenticated() || !isAdmin()) {
    window.location.href = redirectTo;
  }
}

/**
 * Muestra u oculta elementos según el rol del usuario.
 * Busca elementos con atributos data-role="admin" o data-role="user".
 */
function applyRoleVisibility() {
  const user = getUserData();
  const role = user ? user.role : null;

  // Elementos solo para admin
  document.querySelectorAll('[data-role="admin"]').forEach(el => {
    el.style.display = role === 'admin' ? '' : 'none';
  });

  // Elementos solo para usuarios autenticados
  document.querySelectorAll('[data-role="authenticated"]').forEach(el => {
    el.style.display = isAuthenticated() ? '' : 'none';
  });

  // Elementos solo para no autenticados
  document.querySelectorAll('[data-role="guest"]').forEach(el => {
    el.style.display = !isAuthenticated() ? '' : 'none';
  });
}

export {
  isAuthenticated,
  getCurrentRole,
  isAdmin,
  actualizarNavbar,
  requireLogin,
  requireAdmin,
  applyRoleVisibility
};
