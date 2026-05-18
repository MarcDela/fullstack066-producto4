/**
 * Middleware centralizado de manejo de errores.
 * Captura errores de Mongoose, JWT y errores genéricos,
 * devolviendo respuestas consistentes al cliente.
 */

/**
 * Formatea errores de validación de Mongoose.
 * @param {Error} err - Error de Mongoose
 * @returns {Object} Error formateado
 */
function handleValidationError(err) {
  const errors = Object.values(err.errors).map(e => ({
    field: e.path,
    message: e.message
  }));

  return {
    status: 400,
    error: 'Error de validación',
    code: 'VALIDATION_ERROR',
    details: errors
  };
}

/**
 * Formatea errores de duplicado (unique constraint).
 * @param {Error} err - Error de MongoDB
 * @returns {Object} Error formateado
 */
function handleDuplicateError(err) {
  const field = Object.keys(err.keyValue)[0];
  return {
    status: 409,
    error: `El campo "${field}" ya existe con ese valor`,
    code: 'DUPLICATE_ERROR',
    field
  };
}

/**
 * Formatea errores de cast (ID inválido, etc).
 * @param {Error} err - Error de Mongoose
 * @returns {Object} Error formateado
 */
function handleCastError(err) {
  return {
    status: 400,
    error: `Valor inválido para el campo "${err.path}": ${err.value}`,
    code: 'CAST_ERROR'
  };
}

/**
 * Middleware principal de manejo de errores.
 * Debe registrarse como último middleware en Express.
 * 
 * @param {Error} err - Error capturado
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
function errorHandler(err, req, res, next) {
  let response;

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    response = handleValidationError(err);
  }
  // Error de duplicado (código 11000)
  else if (err.code === 11000) {
    response = handleDuplicateError(err);
  }
  // Error de cast (ObjectId inválido)
  else if (err.name === 'CastError') {
    response = handleCastError(err);
  }
  // Error de JWT
  else if (err.name === 'JsonWebTokenError') {
    response = {
      status: 401,
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    };
  }
  // Token expirado
  else if (err.name === 'TokenExpiredError') {
    response = {
      status: 401,
      error: 'Token expirado. Inicia sesión de nuevo',
      code: 'TOKEN_EXPIRED'
    };
  }
  // Error genérico
  else {
    response = {
      status: err.status || 500,
      error: err.message || 'Error interno del servidor',
      code: err.code || 'INTERNAL_ERROR'
    };
  }

  // Log del error en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.message);
    if (err.stack) console.error(err.stack);
  }

  res.status(response.status).json(response);
}

module.exports = { errorHandler };
