const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Oferta {
    id: ID!
    titulo: String!
    empresa: String!
    ubicacion: String!
    descripcion: String
    fecha: String!
  }

  type Demanda {
    id: ID!
    nombre: String!
    profesion: String!
    disponibilidad: String!
    descripcion: String
    fecha: String!
  }

  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    rol: String!
    # No se añade el campo de password para mejorar la seguridad, evitando así enviarlo de vuelta al cliente
  }

  type Autenticacion {
    token: String!
    usuario: Usuario!
  }

  type Query {
    obtenerOfertas: [Oferta]
    obtenerDemandas: [Demanda]
    obtenerUsuarios: [Usuario]
    buscarUsuario(email: String!): Usuario
  }

  type Mutation {
    # Ofertas
    crearOferta(titulo: String!, empresa: String!, ubicacion: String!, descripcion: String): Oferta
    eliminarOferta(id: ID!): String

    # Demandas
    crearDemanda(nombre: String!, profesion: String!, disponibilidad: String!, descripcion: String): Demanda
    eliminarDemanda(id: ID!): String

    # Usuarios
    crearUsuario(nombre: String!, email: String!, password: String!, rol: String!): Usuario
    borrarUsuario(email: String!): String

    # Login
    login(email: String!, password: String!): Autenticacion
  }
`;

module.exports = typeDefs;