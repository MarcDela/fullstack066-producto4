/**
 * Módulo de Login y Registro (login.html).
 * - Login con Fetch API + JWT
 * - Registro de nuevos usuarios
 * - Redirección post-login
 */

import { login, registro } from './api/fetchClient.js';
import { actualizarNavbar, isAuthenticated } from './auth/session.js';

document.addEventListener('DOMContentLoaded', () => {
  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  actualizarNavbar();

  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');
  const mensajeLogin = document.getElementById('mensaje-login');
  const mensajeRegistro = document.getElementById('mensaje-registro');

  /**
   * Muestra un mensaje en el contenedor indicado.
   */
  function mostrarMensaje(container, texto, tipo) {
    if (!container) return;
    container.textContent = texto;
    container.className = 'mt-3';
    container.classList.add(tipo === 'error' ? 'mensaje-error' : 'mensaje-ok');
  }

  /**
   * Handler del formulario de login.
   */
  async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
      mostrarMensaje(mensajeLogin, 'Rellena todos los campos.', 'error');
      return;
    }

    try {
      mostrarMensaje(mensajeLogin, 'Iniciando sesión...', 'ok');
      const result = await login(email, password);
      mostrarMensaje(mensajeLogin, `Bienvenido, ${result.user.username}!`, 'ok');

      // Redirigir después de un breve delay
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    } catch (error) {
      mostrarMensaje(mensajeLogin, error.message, 'error');
    }
  }

  /**
   * Handler del formulario de registro.
   */
  async function handleRegistro(e) {
    e.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!username || !email || !password) {
      mostrarMensaje(mensajeRegistro, 'Rellena todos los campos.', 'error');
      return;
    }

    if (password.length < 6) {
      mostrarMensaje(mensajeRegistro, 'La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    try {
      mostrarMensaje(mensajeRegistro, 'Creando cuenta...', 'ok');
      const result = await registro(username, email, password);
      mostrarMensaje(mensajeRegistro, `Cuenta creada! Bienvenido, ${result.user.username}.`, 'ok');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    } catch (error) {
      mostrarMensaje(mensajeRegistro, error.message, 'error');
    }
  }

  // Registrar eventos
  if (formLogin) formLogin.addEventListener('submit', handleLogin);
  if (formRegistro) formRegistro.addEventListener('submit', handleRegistro);
});
