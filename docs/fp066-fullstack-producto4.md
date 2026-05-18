# Producto 4 - Aplicación FullStack: FrontEnd + API Backend

## Guía para obtener la máxima puntuación (25/25)

---

## Resumen de la Rúbrica (5 criterios × 5 puntos)

| Criterio | Requisito para 5 puntos |
|----------|------------------------|
| **IA Generativa y Mapa Conceptual** | Mínimo 4 prompts documentados + Mapa conceptual A MANO |
| **Backend con Mongoose** | Técnicas avanzadas: plugins, agregaciones, middleware personalizado, conexiones escalables, indexación, hooks, validaciones. Uso de HTTPS |
| **Comunicaciones Asíncronas** | Fetch con autenticación/caché/optimización. WebSockets con autenticación, canales multiplexados, reducción de tráfico |
| **Roles admin/usuario** | Autenticación y autorización sólida, control de acceso basado en atributos/permisos, seguridad avanzada, gestión escalable |
| **Entrega** | Video explicativo + CodeSandbox funcional + repositorio nuevo |

---

## 1. IA Generativa y Mapa Conceptual (5 puntos)

### Prompts a documentar (mínimo 4)

| # | IA utilizada | Prompt introducido | Resultado/Uso |
|---|---|---|---|
| 1 | ChatGPT/Copilot | "Migra el driver nativo de MongoDB a Mongoose con schemas, validaciones, middleware y plugins" | Migración a Mongoose |
| 2 | ChatGPT/Copilot | "Implementa comunicación asíncrona con Fetch API usando caché, autenticación JWT y manejo avanzado de errores" | Sistema Fetch |
| 3 | ChatGPT/Copilot | "Configura Socket.io con autenticación JWT, canales multiplexados y patrón PUB/SUB para notificaciones en tiempo real" | WebSockets |
| 4 | ChatGPT/Copilot | "Implementa sistema de roles con RBAC (Role-Based Access Control) y middleware de autorización en ExpressJS" | Sistema de roles |
| 5 | ChatGPT/Copilot | "Configura HTTPS en ExpressJS con certificados autofirmados para desarrollo local" | Seguridad HTTPS |

### Mapa Conceptual (A MANO)

Debe incluir:
- **Conceptos**: Fullstack, Mongoose (Schema/Model/Middleware/Plugins), Fetch API, WebSockets/Socket.io, RBAC, JWT, HTTPS, PUB/SUB
- **Flujo**: Frontend (Fetch/Socket.io) → HTTPS → ExpressJS → GraphQL → Mongoose → MongoDB
- **Relaciones** entre todos los componentes
- Dibujado a mano, foto/escaneo en el documento

---

## 2. Implementación Backend con Mongoose (5 puntos)

### Estructura del proyecto

```
producto4/
├── server/
│   ├── config/
│   │   ├── db.js              # Conexión Mongoose escalable
│   │   └── https.js           # Configuración HTTPS
│   ├── models/
│   │   ├── User.js            # Schema + middleware + plugins
│   │   ├── Offer.js           # Schema + índices + agregaciones
│   │   └── plugins/
│   │       └── auditPlugin.js # Plugin personalizado
│   ├── graphql/
│   │   ├── schema.js
│   │   └── resolvers/
│   │       ├── userResolvers.js
│   │       └── offerResolvers.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js            # Control de acceso por roles
│   │   └── errorHandler.js
│   ├── sockets/
│   │   └── socketHandler.js   # Socket.io con autenticación
│   ├── certs/                 # Certificados HTTPS
│   │   ├── server.key
│   │   └── server.cert
│   └── app.js
├── client/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── api/
│   │   │   ├── fetchClient.js # Fetch con caché y auth
│   │   │   └── socketClient.js# Socket.io cliente
│   │   ├── auth/
│   │   │   └── session.js     # Gestión de sesión
│   │   └── app.js
│   └── views/
├── .env
├── .gitignore
├── package.json
├── docker-compose.yml
└── README.md
```

### Conexión escalable a MongoDB con Mongoose

```javascript
const mongoose = require('mongoose');

/**
 * Configuración avanzada de conexión Mongoose
 * @async
 */
async function connectDB() {
  const options = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  };

  mongoose.connection.on('connected', () => console.log('Mongoose conectado'));
  mongoose.connection.on('error', (err) => console.error('Error Mongoose:', err));
  mongoose.connection.on('disconnected', () => console.log('Mongoose desconectado'));

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });

  await mongoose.connect(process.env.MONGODB_URI, options);
}

module.exports = { connectDB };
```

### Schema de Usuario con middleware y hooks

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const auditPlugin = require('./plugins/auditPlugin');

/**
 * @typedef {Object} UserSchema
 * @property {String} username - Nombre de usuario único
 * @property {String} email - Email único y validado
 * @property {String} password - Contraseña hasheada
 * @property {String} role - Rol: 'admin' o 'user'
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'Mínimo 3 caracteres'],
    maxlength: [30, 'Máximo 30 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email no válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'Mínimo 6 caracteres'],
    select: false // No incluir en queries por defecto
  },
  role: {
    type: String,
    enum: { values: ['admin', 'user'], message: 'Rol no válido' },
    default: 'user'
  },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true, toJSON: { virtuals: true } });

// Índices para optimización
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

// Middleware pre-save: hashear contraseña
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Middleware post-save: log
userSchema.post('save', function(doc) {
  console.log(`Usuario ${doc.username} guardado correctamente`);
});

// Método de instancia: comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método estático: buscar por rol
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Virtual: nombre completo para display
userSchema.virtual('displayName').get(function() {
  return `${this.username} (${this.role})`;
});

// Plugin de auditoría
userSchema.plugin(auditPlugin);

module.exports = mongoose.model('User', userSchema);
```

### Schema de Oferta con agregaciones

```javascript
const mongoose = require('mongoose');
const auditPlugin = require('./plugins/auditPlugin');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [3, 'Mínimo 3 caracteres'],
    maxlength: [100, 'Máximo 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [1000, 'Máximo 1000 caracteres']
  },
  type: {
    type: String,
    required: true,
    enum: ['oferta', 'demanda']
  },
  category: {
    type: String,
    required: true,
    enum: ['tecnologia', 'hogar', 'vehiculos', 'servicios', 'otros']
  },
  price: { type: Number, min: [0, 'El precio no puede ser negativo'] },
  location: String,
  status: {
    type: String,
    enum: ['activo', 'reservado', 'completado', 'cancelado'],
    default: 'activo'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Índices compuestos
offerSchema.index({ type: 1, category: 1, status: 1 });
offerSchema.index({ userId: 1, status: 1 });
offerSchema.index({ title: 'text', description: 'text' });
offerSchema.index({ createdAt: -1 });

// Middleware pre-find: solo activos por defecto
offerSchema.pre(/^find/, function(next) {
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 'cancelado' } });
  }
  next();
});

// Método estático: agregación de estadísticas
offerSchema.statics.getStats = function() {
  return this.aggregate([
    { $match: { status: 'activo' } },
    { $group: {
      _id: { type: '$type', category: '$category' },
      count: { $sum: 1 },
      avgPrice: { $avg: '$price' },
      maxPrice: { $max: '$price' }
    }},
    { $sort: { count: -1 } }
  ]);
};

// Método estático: búsqueda avanzada con paginación
offerSchema.statics.search = async function(filters, page = 1, limit = 10) {
  const query = {};
  if (filters.keyword) query.$text = { $search: filters.keyword };
  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = filters.category;
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }

  const [offers, total] = await Promise.all([
    this.find(query).populate('userId', 'username email').lean()
      .skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    this.countDocuments(query)
  ]);

  return { offers, total, page, totalPages: Math.ceil(total / limit) };
};

offerSchema.plugin(auditPlugin);
module.exports = mongoose.model('Offer', offerSchema);
```

### Plugin personalizado de auditoría

```javascript
/**
 * Plugin Mongoose para auditoría automática
 * Registra quién y cuándo modificó un documento
 */
function auditPlugin(schema) {
  schema.add({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 0 }
  });

  schema.pre('save', function(next) {
    if (this.isNew) this.version = 1;
    else this.version += 1;
    next();
  });

  schema.pre('findOneAndUpdate', function(next) {
    this.set({ $inc: { version: 1 } });
    next();
  });
}

module.exports = auditPlugin;
```

### Configuración HTTPS

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Crea servidor HTTPS con certificados
 * Para generar certificados de desarrollo:
 * openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.cert -days 365 -nodes
 */
function createHTTPSServer(app) {
  const options = {
    key: fs.readFileSync(path.join(__dirname, '../certs/server.key')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/server.cert'))
  };
  return https.createServer(options, app);
}

module.exports = { createHTTPSServer };
```
