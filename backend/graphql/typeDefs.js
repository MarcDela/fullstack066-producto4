const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    rol: String!
  }

  type Oferta {
    id: ID!
    titulo: String!
    empresa: String!
    ubicacion: String!
    descripcion: String
    salario: Float
    creadaPor: Usuario
    createdAt: String
  }

  type Demanda {
    id: ID!
    nombre: String!
    profesion: String!
    disponibilidad: String!
    descripcion: String
    creadaPor: Usuario
    createdAt: String
  }

  type Autenticacion {
    token: String!
    usuario: Usuario!
  }

  type Query {
    me: Usuario
    obtenerOfertas: [Oferta!]!
    obtenerDemandas: [Demanda!]!
    obtenerUsuarios: [Usuario!]!
    buscarUsuario(email: String!): Usuario
  }

  type Mutation {
    register(nombre: String!, email: String!, password: String!, rol: String): Autenticacion!
    login(email: String!, password: String!): Autenticacion!

    crearOferta(titulo: String!, empresa: String!, ubicacion: String!, descripcion: String, salario: Float): Oferta!
    eliminarOferta(id: ID!): String!

    crearDemanda(nombre: String!, profesion: String!, disponibilidad: String!, descripcion: String): Demanda!
    eliminarDemanda(id: ID!): String!

    borrarUsuario(id: ID!): String!
  }
`;

module.exports = typeDefs;
