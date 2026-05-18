require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const { resolvers } = require('./graphql/resolvers');
const { connectDB } = require('./config/db');
const { createHTTPSServer } = require('./config/https');
const { authMiddleware } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeSocket, emitOfferCreated, emitOfferUpdated, emitOfferDeleted } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Inicializa y arranca el servidor completo:
 * - Express con middleware
 * - Apollo Server (GraphQL)
 * - Socket.io (WebSockets)
 * - HTTPS (si hay certificados)
 */
async function startServer() {
  const app = express();

  // ==================== MIDDLEWARE ====================
  app.use(cors({
    origin: '*',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware de autenticación (añade req.user si hay token válido)
  app.use(authMiddleware);

  // Servir archivos estáticos del cliente
  app.use(express.static(path.join(__dirname, '../client')));

  // ==================== BASE DE DATOS ====================
  await connectDB();

  // ==================== APOLLO SERVER (GRAPHQL) ====================
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ req }),
    formatError: (error) => {
      // Log del error en servidor
      console.error('GraphQL Error:', error.message);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_ERROR',
        path: error.path
      };
    }
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  // ==================== SERVIDOR HTTP/HTTPS ====================
  let server;

  // Intentar HTTPS primero
  const httpsServer = createHTTPSServer(app);
  if (httpsServer) {
    server = httpsServer;
    console.log('🔒 Servidor HTTPS configurado');
  } else {
    // Fallback a HTTP
    server = http.createServer(app);
    console.log('🌐 Servidor HTTP configurado (sin certificados HTTPS)');
  }

  // ==================== SOCKET.IO ====================
  const io = initializeSocket(server);

  // Hacer io accesible en la app para los resolvers
  app.set('io', io);
  app.set('emitOfferCreated', emitOfferCreated);
  app.set('emitOfferUpdated', emitOfferUpdated);
  app.set('emitOfferDeleted', emitOfferDeleted);

  // ==================== RUTA DE SALUD ====================
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      graphql: `/graphql`,
      websocket: 'active'
    });
  });

  // ==================== MANEJO DE ERRORES ====================
  app.use(errorHandler);

  // ==================== ARRANCAR SERVIDOR ====================
  server.listen(PORT, () => {
    const protocol = httpsServer ? 'https' : 'http';
    console.log(`\n🚀 Servidor listo en ${protocol}://localhost:${PORT}`);
    console.log(`📊 GraphQL en ${protocol}://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`🔌 WebSocket activo en ${protocol}://localhost:${PORT}`);
    console.log(`📁 Cliente servido desde /client\n`);
  });
}

startServer().catch(err => {
  console.error('❌ Error fatal al arrancar el servidor:', err);
  process.exit(1);
});
