require('dotenv').config();

const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { WebSocketServer } = require("ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const path = require("path");
const jwt = require("jsonwebtoken");
const conectarDB = require("./config/db"); // Mongoose
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const SECRETO = process.env.JWT_SECRET;

async function startServer() {
  // 1. IMPORTACIÓN DINÁMICA Y BLOQUE DE DIAGNÓSTICO
  const wsModule = await import("graphql-ws");

  // Intentamos extraer la función de las tres ubicaciones posibles
  const useServer =
    wsModule.useServer ||
    (wsModule.default && wsModule.default.useServer) ||
    wsModule.makeServer;

  // --- INICIO BLOQUE DE DIAGNÓSTICO ---
  // console.log("--------------------------------------------------");
  // console.log("🔍 DIAGNÓSTICO DE LIBRERÍA GRAPHQL-WS:");
  // console.log("- ¿useServer es una función?:", typeof useServer === "function");
  // console.log("- Claves en la raíz del módulo:", Object.keys(wsModule));
  // if (wsModule.default) {
  //   console.log("- Claves dentro de .default:", Object.keys(wsModule.default));
  // }
  // console.log("--------------------------------------------------");
  // --- FIN BLOQUE DE DIAGNÓSTICO ---

  const app = express();
  const httpServer = createServer(app);

  // 2. CONFIGURACIÓN SOCKET.IO 
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Permite conexiones desde cualquier origen en CodeSandbox
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🚀 ¡USUARIO CONECTADO VÍA SOCKET.IO! ID:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("👋 Usuario desconectado de Socket.io");
    });
  });

  // Conexión a la BBDD
  await conectarDB();

  // Esquema para Apollo y WebSockets
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  if (typeof useServer === "function") {
    console.log("✅ Motor de suscripciones (Legacy) disponible.");
  }

  // 3. APOLLO SERVER
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      // Inyectamos 'io' en el contexto para poder usarlo en los resolvers
      const token = req.headers.authorization || "";
      let usuario = null;

      if (token) {
        try {
          usuario = jwt.verify(token.replace("Bearer ", ""), SECRETO);
        } catch (error) {
          console.log("Token inválido");
        }
      }
      
      // Retornamos el usuario y la instancia de socket.io
      return { usuario, io };
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  // 4. ARCHIVOS ESTÁTICOS
  app.use(express.static(path.join(__dirname, "client")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
  });

  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "login.html"));
  });

  app.get("/ofertas", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "ofertas.html"));
  });

  app.get("/usuarios", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "usuarios.html"));
  });

  // 5. ENCENDIDO
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor AgroJobs con Socket.io en puerto ${PORT}`);
  });
}

startServer();