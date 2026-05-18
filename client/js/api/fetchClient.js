/**
 * Cliente Fetch avanzado con:
 * - Autenticación JWT automática (Bearer token)
 * - Sistema de caché en memoria con TTL
 * - Reintentos automáticos con backoff exponencial
 * - Manejo centralizado de errores
 * - Interceptores de request/response
 * 
 * @module fetchClient
 */

const API_URL = window.location.origin + '/graphql';

// ==================== SISTEMA DE CACHÉ ====================

/**
 * Caché en memoria con TTL (Time To Live).
 * Almacena respuestas de queries para reducir peticiones al servidor.
 */
const cache = new Map();
const CACHE_TTL = 60000; // 60 segundos por defecto

/**
 * Obtiene un valor del caché si no ha expirado.
 * @param {String} key - Clave del caché
 * @returns {Object|null} Valor cacheado o null si expiró
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Guarda un valor en el caché.
 * @param {String} key - Clave del caché
 * @param {Object} data - Datos a cachear
 */
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalida (limpia) todo el caché o una clave específica.
 * @param {String} [key] - Clave específica a invalidar (opcional)
 */
function invalidateCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// ==================== GESTIÓN DE TOKEN ====================

/**
 * Obtiene el token JWT almacenado en sessionStorage.
 * @returns {String|null} Token JWT o null
 */
function getToken() {
  return sessionStorage.getItem('jwt_token');
}

/**
 * Almacena el token JWT en sessionStorage.
 * @param {String} token - Token JWT
 */
function setToken(token) {
  sessionStorage.setItem('jwt_token', token);
}

/**
 * Elimina el token JWT (logout).
 */
function removeToken() {
  sessionStorage.removeItem('jwt_token');
  sessionStorage.removeItem('user_data');
}

/**
 * Obtiene los datos del usuario almacenados.
 * @returns {Object|null} Datos del usuario
 */
function getUserData() {
  const data = sessionStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
}

/**
 * Almacena los datos del usuario.
 * @param {Object} user - Datos del usuario
 */
function setUserData(user) {
  sessionStorage.setItem('user_data', JSON.stringify(user));
}

// ==================== CLIENTE FETCH PRINCIPAL ====================

/**
 * Realiza una petición GraphQL al servidor con autenticación y caché.
 * 
 * @param {String} query - Query o Mutation GraphQL
 * @param {Object} [variables={}] - Variables de la query
 * @param {Object} [options={}] - Opciones adicionales
 * @param {Boolean} [options.useCache=false] - Usar caché para esta query
 * @param {Number} [options.retries=3] - Número de reintentos
 * @param {Boolean} [options.requireAuth=false] - Requiere autenticación
 * @returns {Promise<Object>} Respuesta del servidor
 * @throws {Error} Si la petición falla después de los reintentos
 */
async function graphqlFetch(query, variables = {}, options = {}) {
  const { useCache = false, retries = 3, requireAuth = false } = options;

  // Verificar autenticación si es requerida
  if (requireAuth && !getToken()) {
    throw new Error('AUTH_REQUIRED: Debes iniciar sesión');
  }

  // Verificar caché (solo para queries, no mutations)
  if (useCache) {
    const cacheKey = JSON.stringify({ query, variables });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('📦 Respuesta desde caché');
      return cached;
    }
  }

  // Construir headers con autenticación
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Reintentos con backoff exponencial
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables })
      });

      // Manejar errores HTTP
      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          throw new Error('UNAUTHORIZED: Sesión expirada');
        }
        throw new Error(`HTTP_ERROR: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Manejar errores GraphQL
      if (result.errors) {
        const error = result.errors[0];
        throw new Error(error.message);
      }

      // Guardar en caché si aplica
      if (useCache) {
        const cacheKey = JSON.stringify({ query, variables });
        setCache(cacheKey, result.data);
      }

      return result.data;

    } catch (error) {
      lastError = error;

      // No reintentar errores de autenticación
      if (error.message.includes('AUTH') || error.message.includes('UNAUTHORIZED')) {
        throw error;
      }

      // Backoff exponencial antes de reintentar
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`⚠️ Reintento ${attempt + 1}/${retries} en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ==================== FUNCIONES DE API ====================

/**
 * Inicia sesión y almacena el token.
 * @param {String} email - Email del usuario
 * @param {String} password - Contraseña
 * @returns {Promise<Object>} Datos de autenticación
 */
async function login(email, password) {
  const data = await graphqlFetch(`
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          id
          username
          email
          role
          isActive
        }
      }
    }
  `, { email, password });

  setToken(data.login.token);
  setUserData(data.login.user);
  invalidateCache();

  return data.login;
}

/**
 * Registra un nuevo usuario.
 * @param {String} username - Nombre de usuario
 * @param {String} email - Email
 * @param {String} password - Contraseña
 * @param {String} [role='user'] - Rol
 * @returns {Promise<Object>} Datos de autenticación
 */
async function registro(username, email, password, role = 'user') {
  const data = await graphqlFetch(`
    mutation Registro($username: String!, $email: String!, $password: String!, $role: String) {
      registro(username: $username, email: $email, password: $password, role: $role) {
        token
        user {
          id
          username
          email
          role
        }
      }
    }
  `, { username, email, password, role });

  setToken(data.registro.token);
  setUserData(data.registro.user);

  return data.registro;
}

/**
 * Cierra sesión.
 */
function logout() {
  removeToken();
  invalidateCache();
  window.location.href = '/login.html';
}

/**
 * Obtiene ofertas con filtros y paginación (con caché).
 */
async function obtenerOfertas(filters = {}) {
  return await graphqlFetch(`
    query ObtenerOfertas($type: String, $category: String, $status: String, $page: Int, $limit: Int) {
      obtenerOfertas(type: $type, category: $category, status: $status, page: $page, limit: $limit) {
        offers {
          id
          title
          company
          location
          description
          type
          category
          status
          createdAt
          userId {
            id
            username
          }
        }
        total
        page
        totalPages
        hasNext
        hasPrev
      }
    }
  `, filters, { useCache: true });
}

/**
 * Crea una nueva oferta.
 */
async function crearOferta(offerData) {
  const data = await graphqlFetch(`
    mutation CrearOferta($title: String!, $company: String!, $location: String!, $description: String, $type: String!, $category: String) {
      crearOferta(title: $title, company: $company, location: $location, description: $description, type: $type, category: $category) {
        id
        title
        company
        location
        description
        type
        category
        status
        createdAt
      }
    }
  `, offerData, { requireAuth: true });

  invalidateCache();
  return data.crearOferta;
}

/**
 * Elimina una oferta.
 */
async function eliminarOferta(id) {
  const data = await graphqlFetch(`
    mutation EliminarOferta($id: ID!) {
      eliminarOferta(id: $id) {
        success
        message
      }
    }
  `, { id }, { requireAuth: true });

  invalidateCache();
  return data.eliminarOferta;
}

/**
 * Obtiene todos los usuarios (admin).
 */
async function obtenerUsuarios() {
  return await graphqlFetch(`
    query {
      obtenerUsuarios {
        id
        username
        email
        role
        isActive
        lastLogin
        createdAt
      }
    }
  `, {}, { requireAuth: true, useCache: true });
}

/**
 * Elimina un usuario (admin).
 */
async function eliminarUsuario(id) {
  const data = await graphqlFetch(`
    mutation EliminarUsuario($id: ID!) {
      eliminarUsuario(id: $id) {
        success
        message
      }
    }
  `, { id }, { requireAuth: true });

  invalidateCache();
  return data.eliminarUsuario;
}

/**
 * Obtiene estadísticas de la plataforma.
 */
async function obtenerEstadisticas() {
  return await graphqlFetch(`
    query {
      obtenerResumen {
        type
        total
        activos
      }
    }
  `, {}, { useCache: true });
}

/**
 * Obtiene el perfil del usuario actual.
 */
async function obtenerPerfil() {
  return await graphqlFetch(`
    query {
      obtenerPerfil {
        id
        username
        email
        role
        lastLogin
        createdAt
      }
    }
  `, {}, { requireAuth: true });
}

// Exportar funciones
export {
  graphqlFetch,
  login,
  registro,
  logout,
  obtenerOfertas,
  crearOferta,
  eliminarOferta,
  obtenerUsuarios,
  eliminarUsuario,
  obtenerEstadisticas,
  obtenerPerfil,
  getToken,
  getUserData,
  setToken,
  setUserData,
  removeToken,
  invalidateCache
};
