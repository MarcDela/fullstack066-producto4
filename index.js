const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const path = require('path');
const jwt = require('jsonwebtoken');
const conectarDB = require('./config/db'); // Mongoose
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

// Temporal, implementar variable de entorno y eliminar de aquí
const SECRETO = process.env.JWT_SECRET || 'MI_CLAVE_SUPER_SECRETA_AGROJOBS';

async function startServer() {
    const app = express();
    
    // 1. Conexión a la BBDD con Mongoose
    await conectarDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        // 2. Aquí extraemos al usuario del token para que los resolvers sepan quién es
        context: ({ req }) => {
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

    // 3. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
    // Aquí le decimos a Express que busque en la nueva carpeta 'client'
    app.use(express.static(path.join(__dirname, 'client')));

    // 4. RUTAS PARA LOS HTML
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

    // 5. Encendido del servidor
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor AgroJobs listo en http://localhost:${PORT}`);
        console.log(`📊 GraphQL Playground en http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer();