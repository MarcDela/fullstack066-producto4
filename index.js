require('dotenv').config();

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http'); 
const { WebSocketServer } = require('ws'); 
const { useServer } = require('./node_modules/graphql-ws/dist/use/ws.js'); 
const { makeExecutableSchema } = require('@graphql-tools/schema');
const path = require('path');
const jwt = require('jsonwebtoken');
const conectarDB = require('./config/db'); // Mongoose
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const SECRETO = process.env.JWT_SECRET;

async function startServer() {
    const app = express();
    const httpServer = createServer(app); // Servidor que usará Express y WebSockets

    
    // 1. Conexión a la BBDD con Mongoose
    await conectarDB();

    // 2. Crear esquema ejecutable (obligatorio para separar WS de Apollo)
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // 3. Configuración del Servidor de WebSockets (Suscripciones)
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql', // Ruta donde escuchará los sockets
    });

    // Instrucción para que el servidor de WS use nuestro esquema y resolvers
    const serverCleanup = useServer({ schema }, wsServer);

    // 4. Configuración de Apollo Server
    const server = new ApolloServer({
        schema,
        plugins: [
            // Plugin para asegurar que todo se cierre bien al apagar el servidor
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
        context: ({ req }) => {
            // Lógica de autenticación para Queries y Mutations (HTTP)
            const token = req.headers.authorization || '';
            if (token) {
                try {
                    const usuario = jwt.verify(token.replace('Bearer ', ''), SECRETO);
                    return { usuario }; 
                } catch (error) {
                    console.log('Token inválido detectado');
                }
            }
            return {};
        }
    });

    await server.start();
    server.applyMiddleware({ app });

    // 5. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
    // Aquí le decimos a Express que busque en la nueva carpeta 'client'
    app.use(express.static(path.join(__dirname, 'client')));

    // RUTAS PARA LOS HTML
    // Esto permite que al entrar a la raíz o a las páginas, se sirvan correctamente
    app.get('*', (req, res) => {
        // Si la ruta empieza por /graphql, dejamos que Apollo la maneje
        if (req.path.startsWith('/graphql')) return next();
        res.sendFile(path.join(__dirname, 'client', 'index.html'));
    });

    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'login.html'));
    });

    app.get('/ofertas', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'ofertas.html'));
    });

    app.get('/usuarios', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'usuarios.html'));
    });

    // 6. Encendido del servidor
    const PORT = process.env.PORT || 4000;
    // 7. IMPORTANTE: Ahora el que escucha es 'httpServer', no 'app'
    httpServer.listen(PORT, () => {
        console.log(`🚀 Servidor AgroJobs en puerto ${PORT}`);
    });
}

startServer();