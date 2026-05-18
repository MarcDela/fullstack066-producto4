const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
// Nueva conexión a MongoDB
const conectarDB = require('./config/db');

async function startServer() {
    const app = express();
    
    // Intentamos conectar a MongoDB antes de lanzar Apollo
    // Esto asegura que si Docker está apagado, el proceso se detenga aquí con un aviso.
    await conectarDB();

    // Creamos la instancia de Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        // Pasamos la DB por contexto para que esté disponible en todos los resolvers
        context: async () => {
            const db = await conectarDB();
            return { db };
        }
    });

    // Arrancamos Apollo antes de aplicarlo a Express
    await server.start();
    server.applyMiddleware({ app });

    const PORT = 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor listo en http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`📊 La persistencia en MongoDB (Atlas) está activa.`);
    });
}

startServer().catch(err => console.error("Error al arrancar el servidor:", err));