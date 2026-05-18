const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'agrojobs_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/**
 * Genera un token JWT para un usuario autenticado.
 * @param {Object} user - Objeto usuario de la DB
 * @returns {String} Token JWT firmado
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id.toString(), 
      email: user.email, 
      role: user.role,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica y decodifica un token JWT.
 * @param {String} token - Token JWT a verificar
 * @returns {Object|null} Payload decodificado o null si es inválido
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticación para Express.
 * Extrae el token del header Authorization (Bearer token).
 * Añade el usuario decodificado a req.user si es válido.
 * 
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      req.user = null;
      return next();
    }

    // Verificar que el usuario sigue existiendo y está activo
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    req.user = decoded;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

/**
 * Middleware que REQUIERE autenticación (devuelve 401 si no hay token válido).
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }
  next();
}

/**
 * Extrae el usuario del contexto GraphQL (para resolvers).
 * @param {Object} context - Contexto de la request
 * @returns {Object|null} Usuario decodificado del token
 */
async function getAuthUser(context) {
  const { req } = context;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) return null;

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) return null;

  return decoded;
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  requireAuth,
  getAuthUser,
  JWT_SECRET
};
