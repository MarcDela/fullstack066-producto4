
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const conectarDB = require('./config/db');

//Improtaciones para uso de sockets.io
const http = require('http');
const { Server } = require('socket.io');

//Esto es lo que me da problemas, creo...
async function startServer() {
    const app = express();
   app.use('/socket-local', express.static(__dirname + '/node_modules/socket.io/client-dist'));

    await conectarDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async () => {
            const db = await conectarDB();
            return { db };
        }
    });

    await server.start();
    server.applyMiddleware({ app });

    //Se crea el servidor http
    const httpServer = http.createServer(app);

     const io = new Server(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`Un usuario se ha conectado por WebSockets: ${socket.id}`);

        socket.on("empleos_alterados", () => {
            console.log("Cambio detectado en empleos. Lanzando aviso a todos los usuarios conectados");
            io.emit("actualizar_interfaz_empleos"); 
        });

        socket.on("disconnect", () => {
            console.log(`Usuario desconectado de WebSockets: ${socket.id}`);
        });
    });

    const PORT = 4000;
  
    httpServer.listen(PORT, () => {
        console.log(`🚀Servidor listo en http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`📊La persistencia en MongoDB (Atlas) está activa.`);
        console.log(`🔌Servidor de WebSockets (Socket.io) escuchando en el puerto ${PORT}`);
    });
}

startServer().catch(err => console.error("Error al arrancar el servidor:", err));