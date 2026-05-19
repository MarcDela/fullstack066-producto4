require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { Server } = require('socket.io');
const conectarDB = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { obtenerUsuario } = require('./middleware/auth');

async function startServer() {
  await conectarDB();

  const app = express();
  const httpServer = http.createServer(app);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.use(cors({ origin: clientUrl, credentials: true }));
  app.get('/', (_, res) => res.send('Backend Producto 4 AgroJobs funcionando. Abre /graphql'));

  const io = new Server(httpServer, {
    cors: { origin: clientUrl, methods: ['GET', 'POST'] }
  });

  io.on('connection', socket => {
    console.log('🔌 Cliente conectado a Socket.io:', socket.id);
    socket.emit('servidorActivo', 'Socket.io conectado correctamente');
  });

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => ({ usuario: await obtenerUsuario(req), io })
  });

  await apollo.start();
  apollo.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Backend listo en http://localhost:${PORT}/graphql`);
    console.log(`🌐 Frontend permitido: ${clientUrl}`);
  });
}

startServer().catch(error => console.error('Error arrancando servidor:', error));
