const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const conectarDB = require('./config/db'); // Mongoose
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const SECRETO = process.env.JWT_SECRET;

async function startServer() {
    const app = express();
    
    // 1. Conexión a la BBDD con Mongoose
    await conectarDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req, connection }) => {
            // Si hay una conexión de WebSocket (connection), usamos sus datos
            if (connection) {
                return connection.context;
            }
            // Si es una petición HTTP normal (req), usamos la lógica actual
            const token = req.headers.authorization || '';
            if (token) {
                try {
                    const usuario = jwt.verify(token.replace('Bearer ', ''), SECRETO);
                    return { usuario }; 
                } catch (error) {
                    console.log('Token inválido');
                }
            }
            return {};
        }
    });

    await server.start();
    server.applyMiddleware({ app });

    // --- CONFIGURACIÓN PARA WEBSOCKETS ---
    // 2. Creamos un servidor HTTP a partir de nuestra 'app' de Express
    const httpServer = http.createServer(app);

    // Instalamos los manejadores de suscripciones en el servidor HTTP
    server.installSubscriptionHandlers(httpServer);

    // 3. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
    // Aquí le decimos a Express que busque en la nueva carpeta 'client'
    app.use(express.static(path.join(__dirname, 'client')));

    // RUTAS PARA LOS HTML
    // Esto permite que al entrar a la raíz o a las páginas, se sirvan correctamente
    app.get('/', (req, res) => {
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

    // 4. Encendido del servidor
    const PORT = process.env.PORT || 4000;
    // 5. IMPORTANTE: Ahora el que escucha es 'httpServer', no 'app'
    httpServer.listen(PORT, () => {
        console.log(`🚀 Servidor AgroJobs en puerto ${PORT}`);
    });
}

startServer();