const { gql } = require('apollo-server-express');

/**
 * Definición del schema GraphQL para AgroJobs Producto 4.
 * Incluye tipos, queries, mutations y tipos de autenticación/roles.
 */
const typeDefs = gql`
  # ==================== TIPOS ====================

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    isActive: Boolean!
    lastLogin: String
    createdAt: String
    updatedAt: String
    displayName: String
  }

  type Offer {
    id: ID!
    title: String!
    company: String!
    location: String!
    description: String
    type: String!
    category: String!
    status: String!
    userId: User
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type PaginatedOffers {
    offers: [Offer]!
    total: Int!
    page: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type OfferStats {
    type: String
    category: String
    count: Int!
    latestDate: String
  }

  type PlatformSummary {
    type: String!
    total: Int!
    activos: Int!
  }

  type UserStats {
    role: String!
    count: Int!
    lastRegistered: String
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  # ==================== QUERIES ====================

  type Query {
    # Usuarios
    obtenerUsuarios: [User]!
    obtenerUsuario(id: ID!): User
    buscarUsuario(email: String!): User
    obtenerPerfil: User

    # Ofertas/Demandas
    obtenerOfertas(type: String, category: String, status: String, page: Int, limit: Int): PaginatedOffers!
    obtenerOferta(id: ID!): Offer
    buscarOfertas(keyword: String!): [Offer]!
    obtenerMisOfertas: [Offer]!

    # Estadísticas
    obtenerEstadisticas: [OfferStats]!
    obtenerResumen: [PlatformSummary]!
    obtenerEstadisticasUsuarios: [UserStats]!
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    # Autenticación
    registro(username: String!, email: String!, password: String!, role: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Usuarios (admin)
    actualizarUsuario(id: ID!, username: String, email: String, role: String, isActive: Boolean): User!
    eliminarUsuario(id: ID!): DeleteResponse!

    # Ofertas/Demandas
    crearOferta(title: String!, company: String!, location: String!, description: String, type: String!, category: String): Offer!
    actualizarOferta(id: ID!, title: String, company: String, location: String, description: String, status: String, category: String): Offer!
    eliminarOferta(id: ID!): DeleteResponse!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    ofertaCreada: Offer!
    ofertaActualizada: Offer!
    ofertaEliminada: DeleteResponse!
  }
`;

module.exports = typeDefs;
