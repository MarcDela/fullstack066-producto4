//Datos de autentificación y gestión de errores de login:
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const SECRETO = 'Clave.env';

//Importaciones para funcionamiento Mongoose:
const usuario = require('../Modelo/usuario');
const oferta = require('../Modelo/empleo');
const demanda = require('../Modelo/oferta');

const resolvers = {

    Query: {
        /**
         * @returns {Promise<Array>} 
         */
       obtenerOfertas: async () => {return await oferta.find();},

        /**
         * Obtiene todas las demandas de la colección 'demandas'.
         * @returns {Promise<Array>} 
         */
        obtenerDemandas: async () => {return await empleo.find();},

        /**
         * Obtiene todos los usuarios de la colección 'usuarios'.
         * @returns {Promise<Array>} 
         */
        obtenerUsuarios: async () => {return await usuario.find();},

        /**
         * @param {string} email //Búsqueda por email de usuario
         * @returns {Promise<Object|null>} 
         */
        buscarUsuario: async (_, { email }) => {return await Usuario.findOne({ email });}
    },

    Mutation: {

        //Funciones ofertas
        crearOferta: async (_, { titulo, empresa, ubicacion, descripcion }) => {
            const nuevaOferta = new Oferta({
            titulo, empresa, ubicacion, descripcion,
            fecha: new Date().toLocaleDateString('es-ES')
            });
            return await nuevaOferta.save();
        },
        
       eliminarOferta: async (_, { id }) => {
            const resultado = await Oferta.findByIdAndDelete(id);
            if (!resultado) throw new Error(`No se encontró el ID ${id}.`);
            return `Oferta con ID ${id} eliminada correctamente.`;
        },

        //funciones demandas
       crearDemanda: async (_, { nombre, profesion, disponibilidad, descripcion }) => {
            try {
                const nuevaDemanda = new Demanda({nombre, profesion, disponibilidad, descripcion,
            fecha: new Date().toLocaleDateString('es-ES')
        });
            return await nuevaDemanda.save();
                } catch (error) {
                     throw new UserInputError('Error al crear la demanda: ' + error.message);
            }
        },

        eliminarDemanda: async (_, { id }) => {
            try {
                const resultado = await Demanda.findByIdAndDelete(id);
            if (!resultado) {
            throw new Error(`Error: No se enceuntra la demanda con ID ${id}.`);
        }
            return `Demanda con ID ${id} eliminada correctamente.`;
                } catch (error) {
                    throw new Error('Error al intentar eliminar la demanda: ' + error.message);
                }
        },

        crearUsuario: async (_, { nombre, email, password, rol }) => {
            try {
                const existe = await Usuario.findOne({ email });
                if (existe) {
                throw new UserInputError('El usuario ya existe con esa direccion de correo');
            }

                const nuevoUsuario = new Usuario({ nombre, email, password, rol });
                return await nuevoUsuario.save();
            } catch (error) {
                throw new UserInputError('No se peude registrar el usuario: ' + error.message);
            }
        },

        borrarUsuario: async (_, { email }) => {
            const resultado = await Usuario.findOneAndDelete({ email });
            if (!resultado) throw new UserInputError('No se encuentra al usuario');
            return `Usuario con email ${email} ha sido eliminado.`;
        },

        //funciones Login
        /**
         * Autentica a un usuario y genera un token JWT.
         * @throws {AuthenticationError} 
         */
        login: async (_, { email, password }) => {
            try {
            const usuario = await Usuario.findOne({ email });
        
            if (!usuario) {
            throw new AuthenticationError('El email no está registrado')}
            if (usuario.password !== password) {
            throw new AuthenticationError('Contraseña incorrecta');
        }

            const token = jwt.sign(
                { id: usuario._id.toString(), email: usuario.email, rol: usuario.rol },
                SECRETO,
                {expiresIn: '2h' }
            );

            return {
                token,
                usuario
            };
            } catch (error) {
            throw new Error('Error en el proceso de autenticación: ' + error.message);
            }
        }
    }
};

module.exports = resolvers;