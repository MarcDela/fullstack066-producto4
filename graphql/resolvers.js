const Usuario = require('../models/Usuarios');
const Oferta = require('../models/Ofertas');
const Demanda = require('../models/Demandas');

const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');

// Temporal, implementar variable de entorno y eliminar de aquí
const SECRETO = process.env.JWT_SECRET || 'MI_CLAVE_SUPER_SECRETA_AGROJOBS';

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
            // Verificación de Autenticación
            if (!context.usuario) throw new AuthenticationError('Debes estar logueado');
            
            // Verificación de Rol: Solo Empresas pueden crear ofertas
            if (context.usuario.rol !== 'Empresa') {
                throw new Error('Solo las empresas pueden publicar ofertas');
            }

            const nuevaOferta = new Oferta({
                ...args,
                fecha: new Date().toLocaleDateString('es-ES'),
                autorId: context.usuario.id // Vinculamos la oferta al usuario real
            });

            const resultado = await nuevaOferta.save();

            /**
             * WEBSOCKETS
             * Aquí es donde notificaremos en tiempo real a todos los conectados.
             * context.io.emit('oferta_nueva', resultado);
             */

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
            if (!context.usuario) throw new AuthenticationError('Inicia sesión primero');

            const nuevaDemanda = new Demanda({
                ...args,
                fecha: new Date().toLocaleDateString('es-ES'),
                autorId: context.usuario.id
            });

            return await nuevaDemanda.save();
        }
    }
};

module.exports = resolvers;