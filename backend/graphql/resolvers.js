const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Oferta = require('../models/Oferta');
const Demanda = require('../models/Demanda');
const { requiereLogin, requiereAdmin } = require('../middleware/auth');

function crearToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

function limpiarUsuario(usuario) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
}

const resolvers = {
  Query: {
    me: (_, __, { usuario }) => usuario,
    obtenerOfertas: async () => Oferta.find().sort({ createdAt: -1 }).populate('creadaPor'),
    obtenerDemandas: async () => Demanda.find().sort({ createdAt: -1 }).populate('creadaPor'),
    obtenerUsuarios: async (_, __, { usuario }) => {
      requiereAdmin(usuario);
      return Usuario.find().select('-password').sort({ createdAt: -1 });
    },
    buscarUsuario: async (_, { email }, { usuario }) => {
      requiereAdmin(usuario);
      return Usuario.findOne({ email }).select('-password');
    }
  },

  Mutation: {
    register: async (_, { nombre, email, password, rol }) => {
      const existe = await Usuario.findOne({ email });
      if (existe) throw new Error('Ya existe un usuario con ese email');
      const totalUsuarios = await Usuario.countDocuments();
      const rolFinal = totalUsuarios === 0 ? 'ADMIN' : (rol === 'ADMIN' ? 'USUARIO' : 'USUARIO');
      const usuario = await Usuario.create({ nombre, email, password, rol: rolFinal });
      return { token: crearToken(usuario), usuario: limpiarUsuario(usuario) };
    },

    login: async (_, { email, password }) => {
      const usuario = await Usuario.findOne({ email });
      if (!usuario) throw new Error('El email no está registrado');
      const ok = await usuario.comprobarPassword(password);
      if (!ok) throw new Error('Contraseña incorrecta');
      return { token: crearToken(usuario), usuario: limpiarUsuario(usuario) };
    },

    crearOferta: async (_, args, { usuario, io }) => {
      requiereLogin(usuario);
      const oferta = await Oferta.create({ ...args, creadaPor: usuario.id });
      const poblada = await oferta.populate('creadaPor');
      io.emit('ofertaCreada', poblada);
      return poblada;
    },

    eliminarOferta: async (_, { id }, { usuario, io }) => {
      requiereAdmin(usuario);
      const eliminada = await Oferta.findByIdAndDelete(id);
      if (!eliminada) throw new Error('No se encontró la oferta');
      io.emit('ofertaEliminada', id);
      return 'Oferta eliminada correctamente';
    },

    crearDemanda: async (_, args, { usuario, io }) => {
      requiereLogin(usuario);
      const demanda = await Demanda.create({ ...args, creadaPor: usuario.id });
      const poblada = await demanda.populate('creadaPor');
      io.emit('demandaCreada', poblada);
      return poblada;
    },

    eliminarDemanda: async (_, { id }, { usuario, io }) => {
      requiereAdmin(usuario);
      const eliminada = await Demanda.findByIdAndDelete(id);
      if (!eliminada) throw new Error('No se encontró la demanda');
      io.emit('demandaEliminada', id);
      return 'Demanda eliminada correctamente';
    },

    borrarUsuario: async (_, { id }, { usuario }) => {
      requiereAdmin(usuario);
      if (usuario.id === id) throw new Error('No puedes borrar tu propio usuario admin');
      const eliminado = await Usuario.findByIdAndDelete(id);
      if (!eliminado) throw new Error('No se encontró el usuario');
      return 'Usuario eliminado correctamente';
    }
  }
};

module.exports = resolvers;
