//Datos de autentificación y gestión de errores de login:
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const SECRETO = 'MI_CLAVE_SUPER_SECRETA_AGROJOBS';

//Importaciones para funcionamiento Mongoose:
const Usuario = require('./models/Usuario');
const Oferta = require('./models/Oferta');
const Demanda = require('./models/Demanda');

const resolvers = {

    Query: {
        /**
         * @returns {Promise<Array>} Lista de ofertas de la DB.
         */
       obtenerOfertas: async () => {return await Oferta.find();},

        /**
         * Obtiene todas las demandas de la colección 'demandas'.
         * @returns {Promise<Array>} Lista de demandas de la DB.
         */
        obtenerDemandas: async () => {return await Demanda.find();},

        /**
         * Obtiene todos los usuarios de la colección 'usuarios'.
         * @returns {Promise<Array>} Lista de usuarios.
         */
        obtenerUsuarios: async () => {return await Usuario.find();},

        /**
         * Busca un usuario único por su email en la base de datos.
         * En MongoDB usamos findOne para obtener un objeto directo.
         * @param {string} email Email a buscar.
         * @returns {Promise<Object|null>} Usuario encontrado.
         */
        buscarUsuario: async (_, { email }) => {return await Usuario.findOne({ email });}
    },

    Mutation: {

        // Ofertas
        /**
         * Crea una nueva oferta de trabajo.
         */
        crearOferta: async (_, { titulo, empresa, ubicacion, descripcion }) => {
            const nuevaOferta = new Oferta({
            titulo, empresa, ubicacion, descripcion,
            fecha: new Date().toLocaleDateString('es-ES')
            });
            return await nuevaOferta.save();
        },
        
        /**
         * Elimina una oferta por su ID de MongoDB.
         */
       eliminarOferta: async (_, { id }) => {
            const resultado = await Oferta.findByIdAndDelete(id);
            if (!resultado) throw new Error(`No se encontró el ID ${id}.`);
            return `Oferta con ID ${id} eliminada correctamente.`;
        },

        // Demandas
        /**
         * Crea una nueva demanda de empleo.
         */
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

        /**
         * Elimina una demanda por su ID.
         */
        eliminarDemanda: async (_, { id }) => {
            try {
                const resultado = await Demanda.findByIdAndDelete(id);
            if (!resultado) {
            throw new Error(`Error: No se encontró la demanda con ID ${id}.`);
        }
            return `Demanda con ID ${id} eliminada correctamente.`;
                } catch (error) {
                    throw new Error('Error al intentar eliminar la demanda: ' + error.message);
                }
        },

        // Usuarios
        /**
         * Registra un nuevo usuario validando duplicados.
         */
        crearUsuario: async (_, { nombre, email, password, rol }) => {
            try {
                const existe = await Usuario.findOne({ email });
                if (existe) {
                throw new UserInputError('El usuario ya existe con ese email');
            }

                const nuevoUsuario = new Usuario({ nombre, email, password, rol });
                return await nuevoUsuario.save();
            } catch (error) {
                throw new UserInputError('No se pudo registrar el usuario: ' + error.message);
            }
        },

        /**
         * Elimina un usuario por su email.
         */
        borrarUsuario: async (_, { email }) => {
            const resultado = await Usuario.findOneAndDelete({ email });
            if (!resultado) throw new UserInputError('No se encontró el usuario');
            return `Usuario con email ${email} ha sido eliminado.`;
        },

        // Login
        /**
         * Autentica a un usuario y genera un token JWT.
         * @throws {AuthenticationError} Si las credenciales fallan.
         */
        login: async (_, { email, password }) => {
            try {
            // Búsqueda del usuario a través del parámetro email
            const usuario = await Usuario.findOne({ email });
        
            // Verificación del usuario
            if (!usuario) {
            throw new AuthenticationError('El email no está registrado')}

            // Verificación de la clave
            if (usuario.password !== password) {
            throw new AuthenticationError('Contraseña incorrecta');
        }

            // Generación token 
            const token = jwt.sign(
                { id: usuario._id.toString(), email: usuario.email, rol: usuario.rol },
                SECRETO,
                {expiresIn: '2h' }
            );

            // Se retorna el token y el usuario
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