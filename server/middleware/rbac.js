/**
 * Middleware RBAC (Role-Based Access Control)
 * Implementa control de acceso basado en roles con permisos granulares.
 * 
 * Roles disponibles:
 * - admin: Acceso total a todas las operaciones
 * - user: Acceso limitado a sus propios recursos
 */

/**
 * Definición de permisos por rol.
 * Cada rol tiene un array de permisos que puede ejecutar.
 */
const PERMISSIONS = {
  admin: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'offers:read',
    'offers:create',
    'offers:update',
    'offers:delete',
    'offers:manage_all',  // Puede gestionar ofertas de otros usuarios
    'stats:read',
    'admin:panel'
  ],
  user: [
    'users:read_own',
    'offers:read',
    'offers:create',
    'offers:update_own',  // Solo puede editar sus propias ofertas
    'offers:delete_own',  // Solo puede eliminar sus propias ofertas
    'stats:read'
  ]
};

/**
 * Verifica si un rol tiene un permiso específico.
 * @param {String} role - Rol del usuario ('admin' o 'user')
 * @param {String} permission - Permiso a verificar (ej: 'offers:create')
 * @returns {Boolean} true si el rol tiene el permiso
 */
function hasPermission(role, permission) {
  if (!PERMISSIONS[role]) return false;
  return PERMISSIONS[role].includes(permission);
}

/**
 * Middleware factory: requiere un permiso específico.
 * Devuelve un middleware que verifica si el usuario tiene el permiso.
 * 
 * @param {String} permission - Permiso requerido
 * @returns {Function} Middleware de Express
 * 
 * @example
 * app.delete('/users/:id', requirePermission('users:delete'), deleteUser);
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        code: 'FORBIDDEN',
        required: permission,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware factory: requiere uno de varios roles.
 * @param {Array<String>} roles - Array de roles permitidos
 * @returns {Function} Middleware de Express
 * 
 * @example
 * app.get('/admin', requireRole(['admin']), adminPanel);
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acceso restringido. Roles permitidos: ${roles.join(', ')}`,
        code: 'ROLE_FORBIDDEN',
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Verifica si el usuario es propietario del recurso o es admin.
 * Útil para operaciones donde el user puede editar lo suyo y admin todo.
 * 
 * @param {String} userId - ID del usuario autenticado
 * @param {String} resourceOwnerId - ID del propietario del recurso
 * @param {String} role - Rol del usuario autenticado
 * @returns {Boolean} true si tiene acceso
 */
function isOwnerOrAdmin(userId, resourceOwnerId, role) {
  if (role === 'admin') return true;
  return userId === resourceOwnerId.toString();
}

/**
 * Verifica permisos en el contexto de GraphQL (para resolvers).
 * Lanza un error si no tiene permisos.
 * 
 * @param {Object} user - Usuario del contexto GraphQL
 * @param {String} permission - Permiso requerido
 * @throws {Error} Si no tiene permisos
 */
function checkGraphQLPermission(user, permission) {
  if (!user) {
    throw new Error('UNAUTHENTICATED: Debes iniciar sesión');
  }

  if (!hasPermission(user.role, permission)) {
    throw new Error(`FORBIDDEN: No tienes permiso para "${permission}"`);
  }
}

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireRole,
  isOwnerOrAdmin,
  checkGraphQLPermission
};
