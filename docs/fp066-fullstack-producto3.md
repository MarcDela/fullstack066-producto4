# Producto 3 - Sirviendo datos con GraphQL y MongoDB

## Guía para obtener la máxima puntuación (25/25)

---

## Resumen de la Rúbrica (5 criterios × 5 puntos)

| Criterio | Requisito para 5 puntos |
|----------|------------------------|
| **IA Generativa y Mapa Conceptual** | Mínimo 4 prompts documentados (IA usada + prompt) + Mapa conceptual A MANO |
| **Implementación ExpressJS** | Código modular y seguro, óptimo manejo de errores, autenticación avanzada, documentación completa con JSDoc |
| **API GraphQL** | Código modular, manejo de errores óptimo, resolvers bien estructurados (Query, Mutation, Type), autenticación avanzada, documentación completa. Types = objetos del producto 2 |
| **Persistencia MongoDB** | Modelos bien diseñados, consultas avanzadas, validaciones robustas, seguridad con login de usuario. Despliegue en Docker local + adaptado en CodeSandbox para MongoAtlas |
| **Entrega** | Video explicativo + despliegue en CodeSandbox/equivalente + código en repositorio nuevo |

---

## 1. IA Generativa y Mapa Conceptual (5 puntos)

### Prompts a documentar (mínimo 4)

Documenta cada prompt con este formato:

| # | IA utilizada | Prompt introducido | Resultado/Uso |
|---|---|---|---|
| 1 | ChatGPT/Copilot | "Genera la estructura base de un proyecto ExpressJS con GraphQL y MongoDB sin Mongoose" | Estructura inicial del proyecto |
| 2 | ChatGPT/Copilot | "Crea un schema GraphQL con Types, Queries y Mutations para gestionar usuarios y ofertas/demandas" | Definición del schema |
| 3 | ChatGPT/Copilot | "Implementa autenticación con JWT en ExpressJS para proteger las rutas GraphQL" | Sistema de autenticación |
| 4 | ChatGPT/Copilot | "Cómo conectar MongoDB nativo (sin Mongoose) desde ExpressJS y realizar operaciones CRUD" | Persistencia de datos |
| 5 | ChatGPT/Copilot | "Implementa validaciones y manejo de errores centralizado en GraphQL resolvers" | Robustez del código |

### Mapa Conceptual (A MANO)

Debe incluir:
- **Conceptos aprendidos**: NodeJS, ExpressJS, GraphQL (Schema, Types, Queries, Mutations, Resolvers), MongoDB (colecciones, documentos, CRUD), JWT, middleware
- **Cómo se aplican**: Flujo de datos desde Postman → ExpressJS → GraphQL → MongoDB
- Relaciones entre conceptos
- Dibujado a mano, foto/escaneo incluido en el documento de entrega

---

## 2. Implementación de Backend con ExpressJS (5 puntos)

### Estructura del proyecto (modular)

```
producto3/
├── src/
│   ├── config/
│   │   └── db.js              # Conexión MongoDB
│   ├── graphql/
│   │   ├── schema.js          # Schema GraphQL completo
│   │   ├── resolvers/
│   │   │   ├── index.js       # Combina resolvers
│   │   │   ├── userResolvers.js
│   │   │   └── offerResolvers.js
│   │   └── types/
│   │       ├── userType.js
│   │       └── offerType.js
│   ├── middleware/
│   │   ├── auth.js            # Autenticación JWT
│   │   ├── errorHandler.js    # Manejo centralizado de errores
│   │   └── validation.js      # Validaciones de entrada
│   ├── services/
│   │   ├── userService.js     # Lógica de negocio usuarios
│   │   └── offerService.js    # Lógica de negocio ofertas/demandas
│   └── app.js                 # Configuración Express
├── .env                       # Variables de entorno
├── .gitignore                 # Incluir node_modules
├── package.json
├── Dockerfile                 # Para MongoDB en Docker
├── docker-compose.yml
└── README.md
```

### Requisitos clave para 5 puntos

```javascript
/**
 * @fileoverview Servidor principal ExpressJS con GraphQL
 * @module app
 * @requires express
 * @requires express-graphql
 * @requires dotenv
 */

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const schema = require('./graphql/schema');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
const app = express();

// Middleware de seguridad
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de payload
app.use(authMiddleware);

// Endpoint único GraphQL
app.use('/graphql', graphqlHTTP((req) => ({
  schema,
  graphiql: true,
  context: { user: req.user }
})));

// Manejo centralizado de errores
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
});
```

### JSDoc - Documentar TODAS las funciones

```javascript
/**
 * Conecta a la base de datos MongoDB
 * @async
 * @function connectDB
 * @returns {Promise<MongoClient>} Cliente de MongoDB conectado
 * @throws {Error} Si no se puede establecer conexión
 */
async function connectDB() { ... }
```

### Autenticación avanzada con JWT

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Middleware de autenticación JWT
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      req.user = null;
    }
  }
  next();
};
```

### Manejo de errores óptimo

```javascript
/**
 * Clase personalizada para errores de la aplicación
 * @class AppError
 * @extends Error
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// En resolvers: try/catch con mensajes descriptivos
```

---

## 3. Implementación de API GraphQL (5 puntos)

### Schema completo con Types, Queries y Mutations

```javascript
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type User {
    _id: ID!
    username: String!
    email: String!
    password: String
    role: String!
    createdAt: String
  }

  type Offer {
    _id: ID!
    title: String!
    description: String!
    type: String!          
    category: String!
    userId: ID!
    user: User
    price: Float
    location: String
    status: String!
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # Usuarios
    getUsers: [User!]!
    getUser(id: ID!): User
    me: User

    # Ofertas/Demandas
    getOffers(type: String, category: String): [Offer!]!
    getOffer(id: ID!): Offer
    getOffersByUser(userId: ID!): [Offer!]!
    searchOffers(keyword: String!): [Offer!]!
  }

  type Mutation {
    # Autenticación
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Usuarios (admin)
    updateUser(id: ID!, username: String, email: String, role: String): User!
    deleteUser(id: ID!): Boolean!

    # Ofertas/Demandas (CRUD completo)
    createOffer(title: String!, description: String!, type: String!, category: String!, price: Float, location: String): Offer!
    updateOffer(id: ID!, title: String, description: String, category: String, price: Float, location: String, status: String): Offer!
    deleteOffer(id: ID!): Boolean!
  }
`);
```

### Resolvers bien estructurados

```javascript
/**
 * Resolvers para operaciones de usuario
 * @module userResolvers
 */
const userResolvers = {
  /**
   * Obtiene todos los usuarios (solo admin)
   * @param {Object} args - Argumentos de la query
   * @param {Object} context - Contexto con usuario autenticado
   * @returns {Promise<Array>} Lista de usuarios
   * @throws {Error} Si no está autenticado o no es admin
   */
  getUsers: async (args, context) => {
    if (!context.user) throw new Error('No autenticado');
    const db = getDB();
    return await db.collection('users').find({}).project({ password: 0 }).toArray();
  },

  /**
   * Registra un nuevo usuario
   * @param {Object} args - {username, email, password}
   * @returns {Promise<AuthPayload>} Token JWT y datos del usuario
   */
  register: async ({ username, email, password }) => {
    // Validaciones
    if (!email || !password || !username) {
      throw new Error('Todos los campos son obligatorios');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener mínimo 6 caracteres');
    }

    const db = getDB();
    const exists = await db.collection('users').findOne({ email });
    if (exists) throw new Error('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.collection('users').insertOne({
      username, email, password: hashedPassword, role: 'user', createdAt: new Date()
    });

    const user = { _id: result.insertedId, username, email, role: 'user' };
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return { token, user };
  },

  // ... más resolvers
};
```

---

## 4. Persistencia con MongoDB (5 puntos)

### Conexión nativa (SIN Mongoose)

```javascript
const { MongoClient, ObjectId } = require('mongodb');

let db = null;

/**
 * Establece conexión con MongoDB
 * @async
 * @returns {Promise<Db>} Instancia de la base de datos
 */
async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  
  // Crear índices para optimización
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('offers').createIndex({ type: 1, category: 1 });
  await db.collection('offers').createIndex({ title: 'text', description: 'text' });
  
  console.log('MongoDB conectado correctamente');
  return db;
}

const getDB = () => db;
module.exports = { connectDB, getDB, ObjectId };
```

### Docker Compose para MongoDB local

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: producto3_mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: producto3
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Variables de entorno (.env)

```env
# Local con Docker
MONGODB_URI=mongodb://admin:password123@localhost:27017/producto3?authSource=admin

# MongoAtlas (para CodeSandbox)
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/producto3

DB_NAME=producto3
JWT_SECRET=tu_secreto_seguro_aqui
PORT=4000
```

### Validaciones robustas en servicios

```javascript
/**
 * Valida los datos de una oferta antes de insertar/actualizar
 * @param {Object} offerData - Datos de la oferta
 * @throws {Error} Si los datos no son válidos
 */
function validateOffer(offerData) {
  const { title, description, type, category } = offerData;
  const validTypes = ['oferta', 'demanda'];
  const validCategories = ['tecnologia', 'hogar', 'vehiculos', 'servicios', 'otros'];

  if (title && (title.length < 3 || title.length > 100)) {
    throw new Error('El título debe tener entre 3 y 100 caracteres');
  }
  if (type && !validTypes.includes(type)) {
    throw new Error(`Tipo inválido. Valores permitidos: ${validTypes.join(', ')}`);
  }
  if (category && !validCategories.includes(category)) {
    throw new Error(`Categoría inválida. Valores permitidos: ${validCategories.join(', ')}`);
  }
}
```

### Consultas avanzadas

```javascript
/**
 * Busca ofertas con filtros avanzados y paginación
 * @param {Object} filters - Filtros de búsqueda
 * @param {number} page - Página actual
 * @param {number} limit - Resultados por página
 * @returns {Promise<Object>} Ofertas y metadata de paginación
 */
async function searchOffers({ keyword, type, category, page = 1, limit = 10 }) {
  const db = getDB();
  const query = {};

  if (keyword) query.$text = { $search: keyword };
  if (type) query.type = type;
  if (category) query.category = category;

  const total = await db.collection('offers').countDocuments(query);
  const offers = await db.collection('offers')
    .find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .toArray();

  return { offers, total, page, totalPages: Math.ceil(total / limit) };
}
```

### Seguridad con login de usuario

- Login obligatorio para crear/editar/eliminar ofertas
- Verificación de propiedad: solo el creador puede editar/eliminar su oferta
- Rol admin puede gestionar todo

```javascript
// Verificación en resolver
createOffer: async (args, context) => {
  if (!context.user) throw new Error('Debe iniciar sesión para crear ofertas');
  // ... crear oferta con userId: context.user.id
},

deleteOffer: async ({ id }, context) => {
  if (!context.user) throw new Error('No autenticado');
  const offer = await db.collection('offers').findOne({ _id: new ObjectId(id) });
  if (!offer) throw new Error('Oferta no encontrada');
  if (offer.userId.toString() !== context.user.id && context.user.role !== 'admin') {
    throw new Error('No autorizado para eliminar esta oferta');
  }
  await db.collection('offers').deleteOne({ _id: new ObjectId(id) });
  return true;
}
```

---

## 5. Entrega (5 puntos)

### Checklist de entrega

- [ ] **Repositorio GitHub nuevo** (independiente de productos anteriores)
  - `.gitignore` con `node_modules/` y `.env`
  - README.md con instrucciones de instalación y uso
- [ ] **CodeSandbox** funcional con MongoAtlas
- [ ] **Video explicativo** mostrando:
  - Estructura del proyecto
  - Demostración con Postman de todas las operaciones CRUD
  - Login y autenticación
  - Conexión a MongoDB
- [ ] **Documento PDF/DOC** (2 páginas) con:
  - Enlace GitHub
  - Enlace CodeSandbox
  - Prompts de IA documentados (mínimo 4)
  - Mapa conceptual a mano (foto/escaneo)

### Dependencias (package.json)

```json
{
  "name": "producto3-graphql-mongodb",
  "version": "1.0.0",
  "description": "Backend con ExpressJS, GraphQL y MongoDB",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-graphql": "^0.12.0",
    "graphql": "^16.8.1",
    "mongodb": "^6.3.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Pruebas con Postman (ejemplos)

### 1. Registro de usuario
```
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "mutation { register(username: \"admin\", email: \"admin@test.com\", password: \"123456\") { token user { _id username email role } } }"
}
```

### 2. Login
```
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "mutation { login(email: \"admin@test.com\", password: \"123456\") { token user { _id username role } } }"
}
```

### 3. Crear oferta (con token)
```
POST http://localhost:4000/graphql
Authorization: Bearer <token_obtenido>
Content-Type: application/json

{
  "query": "mutation { createOffer(title: \"Vendo portátil\", description: \"Portátil gaming en buen estado\", type: \"oferta\", category: \"tecnologia\", price: 500.0, location: \"Barcelona\") { _id title type status createdAt } }"
}
```

### 4. Obtener todas las ofertas
```
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "{ getOffers { _id title description type category price location status createdAt } }"
}
```

### 5. Buscar ofertas
```
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "{ searchOffers(keyword: \"portátil\") { _id title description price } }"
}
```

### 6. Actualizar oferta (con token)
```
POST http://localhost:4000/graphql
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "mutation { updateOffer(id: \"<offer_id>\", price: 450.0, status: \"vendido\") { _id title price status updatedAt } }"
}
```

### 7. Eliminar oferta (con token)
```
POST http://localhost:4000/graphql
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "mutation { deleteOffer(id: \"<offer_id>\") }"
}
```

---

## Puntos clave para máxima nota

1. **Modularidad**: Separar en carpetas (config, graphql, middleware, services)
2. **JSDoc en TODAS las funciones**: Parámetros, retornos, throws
3. **Autenticación JWT completa**: Register, login, middleware de verificación, roles
4. **Manejo de errores**: try/catch en todos los resolvers, clase AppError personalizada
5. **Validaciones**: En entrada de datos, tipos, longitudes, formatos
6. **MongoDB sin Mongoose**: Usar driver nativo `mongodb`
7. **Índices en MongoDB**: Para optimizar consultas frecuentes
8. **Docker + MongoAtlas**: Tener ambos configurados (uno activo, otro comentado)
9. **Video explicativo**: Demostrar TODO el flujo con Postman
10. **4+ prompts documentados** + **mapa conceptual a mano**
