const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const User = require('../models/User');
const Offer = require('../models/Offer');
const { generateToken, getAuthUser } = require('../middleware/auth');
const { checkGraphQLPermission, isOwnerOrAdmin } = require('../middleware/rbac');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

// Eventos de subscripción
const EVENTS = {
  OFERTA_CREADA: 'OFERTA_CREADA',
  OFERTA_ACTUALIZADA: 'OFERTA_ACTUALIZADA',
  OFERTA_ELIMINADA: 'OFERTA_ELIMINADA'
};

const resolvers = {
  // Field resolvers to map MongoDB _id to GraphQL id
  User: {
    id: (parent) => parent._id ? parent._id.toString() : parent.id
  },
  Offer: {
    id: (parent) => parent._id ? parent._id.toString() : parent.id
  },

  Query: {
    // ==================== USUARIOS ====================

    /**
     * Obtiene todos los usuarios (solo admin).
     */
    obtenerUsuarios: async (_, __, context) => {
      const user = await getAuthUser(context);
      checkGraphQLPermission(user, 'users:read');
      return await User.find({});
    },

    /**
     * Obtiene un usuario por ID.
     */
    obtenerUsuario: async (_, { id }, context) => {
      const user = await getAuthUser(context);
      if (!user) throw new AuthenticationError('Debes iniciar sesión');

      const foundUser = await User.findById(id);
      if (!foundUser) throw new UserInputError('Usuario no encontrado');
      return foundUser;
    },

    /**
     * Busca un usuario por email.
     */
    buscarUsuario: async (_, { email }, context) => {
      const user = await getAuthUser(context);
      if (!user) throw new AuthenticationError('Debes iniciar sesión');

      const foundUser = await User.findOne({ email });
      return foundUser;
    },

    /**
     * Obtiene el perfil del usuario autenticado.
     */
    obtenerPerfil: async (_, __, context) => {
      const user = await getAuthUser(context);
      if (!user) throw new AuthenticationError('Debes iniciar sesión');

      return await User.findById(user.id);
    },

    // ==================== OFERTAS ====================

    /**
     * Obtiene ofertas con filtros y paginación.
     */
    obtenerOfertas: async (_, { type, category, status, page = 1, limit = 10 }) => {
      const filters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (status) filters.status = status;

      return await Offer.search(filters, page, limit);
    },

    /**
     * Obtiene una oferta por ID.
     */
    obtenerOferta: async (_, { id }) => {
      const offer = await Offer.findById(id).populate('userId', 'username email role');
      if (!offer) throw new UserInputError('Oferta no encontrada');
      return offer;
    },

    /**
     * Búsqueda por texto en ofertas.
     */
    buscarOfertas: async (_, { keyword }) => {
      return await Offer.find(
        { $text: { $search: keyword } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } })
       .populate('userId', 'username email')
       .limit(20);
    },

    /**
     * Obtiene las ofertas del usuario autenticado.
     */
    obtenerMisOfertas: async (_, __, context) => {
      const user = await getAuthUser(context);
      if (!user) throw new AuthenticationError('Debes iniciar sesión');

      return await Offer.find({ userId: user.id })
        .sort({ createdAt: -1 });
    },

    // ==================== ESTADÍSTICAS ====================

    /**
     * Estadísticas de ofertas por tipo y categoría.
     */
    obtenerEstadisticas: async () => {
      const stats = await Offer.getStats();
      return stats.map(s => ({
        type: s._id.type,
        category: s._id.category,
        count: s.count,
        latestDate: s.latestDate ? s.latestDate.toISOString() : null
      }));
    },

    /**
     * Resumen general de la plataforma.
     */
    obtenerResumen: async () => {
      const summary = await Offer.getSummary();
      return summary.map(s => ({
        type: s._id,
        total: s.total,
        activos: s.activos
      }));
    },

    /**
     * Estadísticas de usuarios por rol (solo admin).
     */
    obtenerEstadisticasUsuarios: async (_, __, context) => {
      const user = await getAuthUser(context);
      checkGraphQLPermission(user, 'users:read');

      const stats = await User.getUserStats();
      return stats.map(s => ({
        role: s._id,
        count: s.count,
        lastRegistered: s.lastRegistered ? s.lastRegistered.toISOString() : null
      }));
    }
  },

  Mutation: {
    // ==================== AUTENTICACIÓN ====================

    /**
     * Registra un nuevo usuario y devuelve token JWT.
     */
    registro: async (_, { username, email, password, role }) => {
      // Verificar si ya existe
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new UserInputError('Ya existe un usuario con ese email');
        }
        throw new UserInputError('Ya existe un usuario con ese nombre');
      }

      // Crear usuario (el password se hashea en el pre-save hook)
      const newUser = await User.create({
        username,
        email,
        password,
        role: role || 'user'
      });

      const token = generateToken(newUser);

      return {
        token,
        user: newUser
      };
    },

    /**
     * Autentica un usuario y devuelve token JWT.
     */
    login: async (_, { email, password }) => {
      // Buscar usuario incluyendo password
      const user = await User.findByEmailWithPassword(email);

      if (!user) {
        throw new AuthenticationError('Email no registrado');
      }

      if (!user.isActive) {
        throw new AuthenticationError('Cuenta desactivada. Contacta al administrador');
      }

      // Verificar contraseña con bcrypt
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new AuthenticationError('Contraseña incorrecta');
      }

      // Actualizar último login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user);

      return {
        token,
        user
      };
    },

    // ==================== USUARIOS (ADMIN) ====================

    /**
     * Actualiza un usuario (solo admin).
     */
    actualizarUsuario: async (_, args, context) => {
      const user = await getAuthUser(context);
      checkGraphQLPermission(user, 'users:update');

      const { id, ...updateData } = args;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: user.id },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new UserInputError('Usuario no encontrado');
      }

      return updatedUser;
    },

    /**
     * Elimina (desactiva) un usuario (solo admin).
     */
    eliminarUsuario: async (_, { id }, context) => {
      const user = await getAuthUser(context);
      checkGraphQLPermission(user, 'users:delete');

      // No permitir auto-eliminación
      if (user.id === id) {
        throw new ForbiddenError('No puedes eliminar tu propia cuenta');
      }

      const deletedUser = await User.findByIdAndUpdate(
        id,
        { isActive: false, updatedBy: user.id },
        { new: true }
      );

      if (!deletedUser) {
        throw new UserInputError('Usuario no encontrado');
      }

      return { success: true, message: `Usuario "${deletedUser.username}" desactivado` };
    },

    // ==================== OFERTAS ====================

    /**
     * Crea una nueva oferta/demanda.
     */
    crearOferta: async (_, args, context) => {
      const user = await getAuthUser(context);
      checkGraphQLPermission(user, 'offers:create');

      const newOffer = await Offer.create({
        ...args,
        category: args.category || 'agricultura',
        userId: user.id,
        createdBy: user.id
      });

      // Populate para devolver datos del usuario
      const populated = await Offer.findById(newOffer._id)
        .populate('userId', 'username email role');

      // Publicar evento para WebSocket
      pubsub.publish(EVENTS.OFERTA_CREADA, { ofertaCreada: populated });

      return populated;
    },

    /**
     * Actualiza una oferta (propietario o admin).
     */
    actualizarOferta: async (_, args, context) => {
      const user = await getAuthUser(context);
      if (!user) throw new AuthenticationError('Debes iniciar sesión');

      const { id, ...updateData } = args;

      const offer = await Offer.findById(id);
      if (!offer) throw new UserInputError('Oferta no encontrada');

      // Verificar permisos: propietario o admin
      if (!isOwnerOrAdmin(user.id, offer.userId, user.role)) {
        throw new ForbiddenError('No tienes permisos para editar esta oferta');
      }

      const updatedOffer = await Offer.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: user.id },
        { new: true, runValidators: true }
      ).populate('userId', 'username email role');

      pubsub.publish(EVENTS.OFERTA_ACTUALIZADA, { ofertaActualizada: updatedOffer });

      return updatedOffer;
    },

    /**
     * Elimina una oferta (propietario o admin).
     */
    eliminarOferta: async (_, { id }, context) => {
      const user = await getAuthUser(context);
      if (!user) throw new AuthenticationError('Debes iniciar sesión');

      const offer = await Offer.findById(id);
      if (!offer) throw new UserInputError('Oferta no encontrada');

      // Verificar permisos
      if (!isOwnerOrAdmin(user.id, offer.userId, user.role)) {
        throw new ForbiddenError('No tienes permisos para eliminar esta oferta');
      }

      await Offer.findByIdAndDelete(id);

      pubsub.publish(EVENTS.OFERTA_ELIMINADA, { 
        ofertaEliminada: { success: true, message: `Oferta "${offer.title}" eliminada` }
      });

      return { success: true, message: `Oferta "${offer.title}" eliminada correctamente` };
    }
  },

  Subscription: {
    ofertaCreada: {
      subscribe: () => pubsub.asyncIterator([EVENTS.OFERTA_CREADA])
    },
    ofertaActualizada: {
      subscribe: () => pubsub.asyncIterator([EVENTS.OFERTA_ACTUALIZADA])
    },
    ofertaEliminada: {
      subscribe: () => pubsub.asyncIterator([EVENTS.OFERTA_ELIMINADA])
    }
  }
};

module.exports = { resolvers, pubsub, EVENTS };
