const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function obtenerUsuario(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return await Usuario.findById(payload.id).select('-password');
  } catch (_) {
    return null;
  }
}

function requiereLogin(usuario) {
  if (!usuario) throw new Error('No autorizado. Debes iniciar sesión.');
}

function requiereAdmin(usuario) {
  requiereLogin(usuario);
  if (usuario.rol !== 'ADMIN') throw new Error('Acceso denegado. Se requiere rol ADMIN.');
}

module.exports = { obtenerUsuario, requiereLogin, requiereAdmin };
