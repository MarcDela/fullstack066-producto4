require('dotenv').config();

const Usuario = require('../models/Usuarios');
const Oferta = require('../models/Ofertas');
const Demanda = require('../models/Demandas');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');

const SECRETO = process.env.JWT_SECRET;

const resolvers = {
    Query: {
        /**
         * Ya no necesitamos extraer { db } del contexto porque los modelos están conectados.
         */
        obtenerOfertas: async () => await Oferta.find(),
        obtenerDemandas: async () => await Demanda.find(),
        obtenerUsuarios: async () => await Usuario.find(),
        buscarUsuario: async (_, { email }) => await Usuario.findOne({ email }),
    },

    Mutation: {
        // --- SECCIÓN USUARIOS ---
        crearUsuario: async (_, { nombre, email, password, rol }) => {
            const existe = await Usuario.findOne({ email });
            if (existe) throw new UserInputError('El email ya está registrado');

            // Mongoose validará automáticamente el 'rol' contra el enum que definimos
            const nuevoUsuario = new Usuario({ nombre, email, password, rol });
            return await nuevoUsuario.save();
        },

        login: async (_, { email, password }) => {
            const usuario = await Usuario.findOne({ email });
            if (!usuario || usuario.password !== password) {
                throw new AuthenticationError('Credenciales incorrectas');
            }

            const token = jwt.sign(
                { id: usuario.id, email: usuario.email, rol: usuario.rol },
                SECRETO,
                { expiresIn: '2h' }
            );

            return { token, usuario };
        },

        // --- SECCIÓN OFERTAS CON CONTROL DE ROLES ---
        crearOferta: async (_, args, context) => {
            // 1. Verificar si el usuario está autenticado
            if (!context.usuario) {
                throw new Error("No autenticado");
            }

            // 2. CONTROL DE ROL: Solo Empresa o Administrador pueden crear ofertas
            if (context.usuario.rol !== 'Empresa' && context.usuario.rol !== 'Administrador') {
                throw new Error("Acceso denegado: Solo las empresas pueden publicar ofertas");
            }

            // 3. Si pasa el control, se guarda en MongoDB
            const nuevaOferta = new Oferta({
                ...args,
                autorId: context.usuario.id // Guardamos quién la creó
            });
            const resultado = await nuevaOferta.save();

            // 4. WEBSOCKET: Notificamos a todos los suscriptores
            pubsub.publish('OFERTA_CREADA', { 
                ofertaCreada: resultado 
            });

            return resultado;

        },

        eliminarOferta: async (_, { id }, context) => {
            if (!context.usuario) throw new AuthenticationError('No autenticado');

            const oferta = await Oferta.findById(id);
            if (!oferta) throw new Error('Oferta no encontrada');

            // Seguridad: Solo el autor o un Administrador pueden borrar
            if (oferta.autorId.toString() !== context.usuario.id && context.usuario.rol !== 'Administrador') {
                throw new Error('No tienes permiso para borrar esta oferta');
            }

            await Oferta.findByIdAndDelete(id);
            return `Oferta ${id} eliminada.`;
        },

        // --- SECCIÓN DEMANDAS ---
        crearDemanda: async (_, args, context) => {
            if (!context.usuario) {
                throw new Error("No autenticado");
            }

            // CONTROL DE ROL: Solo Candidato o Administrador pueden crear demandas
            if (context.usuario.rol !== 'Candidato' && context.usuario.rol !== 'Administrador') {
                throw new Error("Acceso denegado: Solo los candidatos pueden publicar demandas");
            }

            const nuevaDemanda = new Demanda({
                ...args,
                autorId: context.usuario.id // Guardamos quién la creó
            });
            const resultado = await nuevaDemanda.save();

            // 4. WEBSOCKET: Notificamos a todos los suscriptores
            pubsub.publish('DEMANDA_CREADA', { 
                demandaCreada: resultado 
            });

            return resultado;
        },

        eliminarDemanda: async (_, { id }, context) => {
            if (!context.usuario) throw new Error("No autenticado");

            const demanda = await Demanda.findById(id);
            if (!demanda) throw new Error("Demanda no encontrada");

            // Seguridad: Solo el autor o un Administrador
            if (
                demanda.autorId.toString() !== context.usuario.id &&
                context.usuario.rol !== "Administrador"
            ) {
                throw new Error("No tienes permiso para borrar esta demanda");
            }

            await Demanda.findByIdAndDelete(id);
            return `Demanda ${id} eliminada.`;
        },
    },

    Subscription: {
        ofertaCreada: {
            // "Escucha" el canal 'OFERTA_CREADA'
            subscribe: () => pubsub.asyncIterator(['OFERTA_CREADA'])
        },
        demandaCreada: {
            subscribe: () => pubsub.asyncIterator(['DEMANDA_CREADA'])
        }
    }
};

module.exports = resolvers;