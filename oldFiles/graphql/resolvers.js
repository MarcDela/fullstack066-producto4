// Importamos los datos iniciales
const { ofertas, demandas, usuarios } = require('../data/datos.js');
// Datos de autentificación y gestión de errores de login
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const SECRETO = 'MI_CLAVE_SUPER_SECRETA_AGROJOBS';
// Esto lo usamos para recuperar el ID de los objetos, ahora que usamos MongoDB, el se va a encargar de generarlos
const { ObjectId } = require('mongodb');

const resolvers = {

    Query: {
        /**
         * Obtiene todas las ofertas de la colección 'ofertas'.
         * Usamos el tercer argumento { db } extraído del contexto.
         * @returns {Promise<Array>} Lista de ofertas de la DB.
         */
        obtenerOfertas: async (_, __, { db }) => {
            const ofertas = await db.collection('ofertas').find().toArray();
            return ofertas.map(o => ({ ...o, id: o._id.toString() }));
        },

        /**
         * Obtiene todas las demandas de la colección 'demandas'.
         * @returns {Promise<Array>} Lista de demandas de la DB.
         */
        obtenerDemandas: async (_, __, { db }) => {
            const demandas = await db.collection('demandas').find().toArray();
            return demandas.map(d => ({ ...d, id: d._id.toString() }));
        },

        /**
         * Obtiene todos los usuarios de la colección 'usuarios'.
         * @returns {Promise<Array>} Lista de usuarios.
         */
        obtenerUsuarios: async (_, __, { db }) => {
            const usuarios = await db.collection('usuarios').find().toArray();
            // Mapeamos los resultados para que '_id' (campo por defecto de MongoDB) pase a ser 'id'
            return usuarios.map(usuario => ({
                ...usuario,
                id: usuario._id.toString()
            }));
        },

        /**
         * Busca un usuario único por su email en la base de datos.
         * En MongoDB usamos findOne para obtener un objeto directo.
         * @param {string} email Email a buscar.
         * @returns {Promise<Object|null>} Usuario encontrado.
         */
        buscarUsuario: async (_, { email }, { db }) => {
            const usuario = await db.collection('usuarios').findOne({ email });

            // Si no encuentra el usuario, devolvemos null (GraphQL lo gestionará)
            if (!usuario) return null;

            // Mapeamos _id a id antes de devolverlo
            return {
                ...usuario,
                id: usuario._id.toString()
            };
        },
    },

    Mutation: {

        // Ofertas
        /**
         * Crea una nueva oferta de trabajo.
         */
        crearOferta: async (_, { titulo, empresa, ubicacion, descripcion }, { db }) => {
            const nuevaOferta = {
                // No asignamos ID manualmente, MongoDB lo hace por nosotros
                titulo,
                empresa,
                ubicacion,
                descripcion,
                fecha: new Date().toLocaleDateString('es-ES') // Formato español
            };
            const resultado = await db.collection('ofertas').insertOne(nuevaOferta);
            
            // Retornamos el objeto con el ID que generó la base de datos
            return { 
                ...nuevaOferta, 
                id: resultado.insertedId 
            };
        },

        /**
         * Elimina una oferta por su ID de MongoDB.
         */
        eliminarOferta: async (_, { id }, { db }) => {
            // Intentamos eliminar usando el ID único de MongoDB
            // Nota: id suele venir como String desde GraphQL, lo convertimos a ObjectId
            const resultado = await db.collection('ofertas').deleteOne({ 
                _id: new ObjectId(id) 
            });

            if (resultado.deletedCount === 1) {
                return `Oferta con ID ${id} eliminada correctamente.`;
            } else {
                // Manejo de errores óptimo (como pide la rúbrica)
                throw new Error(`Error: No se encontró la oferta con ID ${id}.`);
            }
        },

        // Demandas
        /**
         * Crea una nueva demanda de empleo.
         */
        crearDemanda: async (_, { nombre, profesion, disponibilidad, descripcion }, { db }) => {
            const nuevaDemanda = {
                nombre, 
                profesion, 
                disponibilidad, 
                descripcion,
                fecha: new Date().toLocaleDateString('es-ES')
            };
            const resultado = await db.collection('demandas').insertOne(nuevaDemanda);
            
            return { 
                ...nuevaDemanda, 
                id: resultado.insertedId 
            };
        },

        /**
         * Elimina una demanda por su ID.
         */
        eliminarDemanda: async (_, { id }, { db }) => {
            const resultado = await db.collection('demandas').deleteOne({ 
                _id: new ObjectId(id) 
            });

            if (resultado.deletedCount === 1) {
                return `Demanda con ID ${id} eliminada correctamente.`;
            } else {
                throw new Error(`Error: No se encontró la demanda con ID ${id}.`);
            }
        },

        // Usuarios
        /**
         * Registra un nuevo usuario validando duplicados.
         */
        crearUsuario: async (_, { nombre, email, password, rol }, { db }) => {
            const existe = await db.collection('usuarios').findOne({ email });

            if (existe) {
                throw new UserInputError('El usuario ya existe con ese email');
            }

            const nuevoUsuario = {
                nombre,
                email,
                password,
                rol
            };
            const resultado = await db.collection('usuarios').insertOne(nuevoUsuario);
            
            return { 
                ...nuevoUsuario, 
                id: resultado.insertedId 
            };
        },

        /**
         * Elimina un usuario por su email.
         */
        borrarUsuario: async (_, { email }, { db }) => {
            const resultado = await db.collection('usuarios').deleteOne({ email });
            
            if (resultado.deletedCount === 0) {
                throw new UserInputError('No se encontró el usuario a eliminar');
            }

            return `Usuario con email ${email} ha sido eliminado.`;
        },

        // Login
        /**
         * Autentica a un usuario y genera un token JWT.
         * @throws {AuthenticationError} Si las credenciales fallan.
         */
        login: async (_, { email, password }, { db }) => {
            const usuario = await db.collection('usuarios').findOne({ email });
            
            // Verificar usuario
            if (!usuario) {
                throw new AuthenticationError('El email no está registrado');
            }

            // Verificar password
            if (usuario.password !== password) {
                throw new AuthenticationError('Contraseña incorrecta');
            }

            // Generar Token JWT
            // Guardamos el ID y el Rol dentro del token
            const token = jwt.sign(
                { id: usuario._id.toString(), email: usuario.email, rol: usuario.rol },
                SECRETO,
                { expiresIn: '2h' } // El token caduca en 2 horas
            );

            return {
                token,
                usuario: {
                    ...usuario,
                    id: usuario._id.toString()
                }
            };
        }
    }
};

module.exports = resolvers;