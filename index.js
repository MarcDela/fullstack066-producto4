require('dotenv').config();

const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require("http");
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

  // Conexión a la BBDD
  await conectarDB();

  // Esquema para Apollo y WebSockets
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // 2. CONFIGURACIÓN WEBSOCKET
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  if (typeof useServer === "function") {
    useServer(
      {
        schema,
        onConnect: (ctx) => {
          console.log("🚀 ¡CONEXIÓN WEBSOCKET DETECTADA EN EL SERVIDOR!");
          return true;
        },
        onSubscribe: (ctx, msg) => {
          console.log("📡 Suscripción recibida para:", msg.payload.query);
        },
      },
      wsServer
    );
    console.log("✅ Motor de suscripciones cargado correctamente.");
  } else {
    console.log("❌ Error: No se encontró la función de servidor.");
  }

  // 3. APOLLO SERVER
  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              if (wsServer) wsServer.close();
            },
          };
        },
      },
    ],
    context: ({ req }) => {
      const token = req.headers.authorization || "";
      if (token) {
        try {
          const usuario = jwt.verify(token.replace("Bearer ", ""), SECRETO);
          return { usuario };
        } catch (error) {
          console.log("Token inválido");
        }
      }
      return {};
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
    console.log(`🚀 Servidor AgroJobs en puerto ${PORT}`);
  });
}

startServer();