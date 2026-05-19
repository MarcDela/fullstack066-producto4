# AgroJobs - Producto 4: Aplicación FullStack

Aplicación web fullstack de gestión de ofertas y demandas de empleo en el sector agrícola.

## 🌐 Demo en vivo

| Plataforma | URL | Estado |
|------------|-----|--------|
| **Render (principal)** | https://fullstack066-producto4.onrender.com/ | ✅ Funcional (puede tardar ~30s en despertar si lleva inactivo) |
| **CodeSandbox** | https://codesandbox.io/p/sandbox/github/MarcDela/fullstack066-producto4/tree/leonardo | ⚠️ Problemas de infraestructura (502 / microVM no arranca) |
| **StackBlitz** | https://stackblitz.com/github/MarcDela/fullstack066-producto4/tree/leonardo?file=README.md | ⚠️ WebContainers no soporta bien mongoose/bcryptjs nativos |

> **Nota:** CodeSandbox presentó errores de "Service Disruption" (502) durante el desarrollo. StackBlitz usa WebContainers (ejecución en navegador) que no es compatible con dependencias nativas de Node.js como `mongoose` y `bcryptjs`. Por ello, el despliegue principal se realizó en **Render.com** que ejecuta un servidor Node.js real.

## Tecnologías

- **Backend**: Node.js + Express + Apollo Server (GraphQL) + Mongoose + Socket.io
- **Frontend**: HTML5 + CSS3 + Bootstrap 5 + JavaScript (ES Modules)
- **Base de datos**: MongoDB Atlas (Mongoose ODM)
- **Autenticación**: JWT + bcrypt + RBAC
- **Comunicación**: Fetch API (con caché) + WebSockets (Socket.io)
- **Seguridad**: HTTPS con certificados autofirmados

---

## 1. IA Generativa - Prompts Documentados

| # | IA utilizada | Prompt introducido | Resultado/Uso |
|---|---|---|---|
| 1 | Kiro (Claude) | "Migra el driver nativo de MongoDB a Mongoose con schemas, validaciones, middleware, plugins y hooks" | Migración completa a Mongoose con User.js y Offer.js |
| 2 | Kiro (Claude) | "Implementa comunicación asíncrona con Fetch API usando caché en memoria, autenticación JWT automática y reintentos con backoff exponencial" | fetchClient.js con sistema de caché TTL |
| 3 | Kiro (Claude) | "Configura Socket.io con autenticación JWT en la conexión, canales multiplexados por categoría y patrón PUB/SUB para notificaciones en tiempo real" | socketHandler.js + socketClient.js |
| 4 | Kiro (Claude) | "Implementa sistema de roles RBAC con middleware de autorización, permisos granulares y verificación en resolvers GraphQL" | rbac.js con PERMISSIONS por rol |
| 5 | Kiro (Claude) | "Configura HTTPS en Express con certificados autofirmados y fallback a HTTP si no existen" | config/https.js con detección automática |

---

## 2. Estructura del Proyecto

```
producto4/
├── server/
│   ├── config/
│   │   ├── db.js              # Conexión Mongoose escalable (pool, eventos, graceful shutdown)
│   │   └── https.js           # Configuración HTTPS con certificados
│   ├── models/
│   │   ├── User.js            # Schema + middleware + plugins + índices + virtuals
│   │   ├── Offer.js           # Schema + agregaciones + búsqueda paginada + índices
│   │   └── plugins/
│   │       └── auditPlugin.js # Plugin personalizado de auditoría (versión + createdBy/updatedBy)
│   ├── graphql/
│   │   ├── typeDefs.js        # Schema GraphQL completo
│   │   └── resolvers.js       # Resolvers con auth + RBAC + PubSub
│   ├── middleware/
│   │   ├── auth.js            # JWT: generación, verificación, middleware Express
│   │   ├── rbac.js            # RBAC: permisos por rol, middleware de autorización
│   │   └── errorHandler.js    # Manejo centralizado de errores
│   ├── sockets/
│   │   └── socketHandler.js   # Socket.io: auth JWT, canales, PUB/SUB
│   ├── certs/                 # Certificados HTTPS (no versionados)
│   ├── seed.js                # Script de datos iniciales
│   └── app.js                 # Punto de entrada del servidor
├── client/
│   ├── index.html             # Dashboard con WebSocket en tiempo real
│   ├── login.html             # Login + Registro con JWT
│   ├── ofertas.html           # CRUD ofertas con filtros y paginación
│   ├── usuarios.html          # Panel admin (RBAC)
│   ├── css/style.css
│   ├── img/
│   └── js/
│       ├── api/
│       │   ├── fetchClient.js # Fetch con caché, JWT, reintentos
│       │   └── socketClient.js# Socket.io cliente con PUB/SUB
│       ├── auth/
│       │   └── session.js     # Gestión de sesión y roles en UI
│       ├── app.js             # Dashboard JS
│       ├── login.js           # Login/Registro JS
│       ├── ofertas.js         # Ofertas JS
│       └── usuarios.js        # Usuarios JS (admin)
├── .env                       # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con tu URI de MongoDB Atlas
# Editar .env y poner tu cadena de conexión real

# 3. (Opcional) Generar certificados HTTPS para desarrollo
npm run generate-certs

# 4. Poblar la base de datos con datos iniciales
npm run seed

# 5. Arrancar el servidor
npm start
# o en modo desarrollo:
npm run dev
```

El servidor arranca en `http://localhost:4000` (o `https://localhost:4000` si hay certificados).

---

## 4. Credenciales de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@agrojobs.com | 123456aA | admin |
| LauraGomez | laura@correo.com | 123456aA | user |
| CampoGrande | rrhh@campogrande.com | 123456aA | user |

---

## 5. Características Implementadas

### Backend con Mongoose (Criterio 2)
- ✅ Conexión escalable con pool de conexiones y eventos de monitoreo
- ✅ Schemas con validaciones avanzadas (required, enum, match, min/max)
- ✅ Middleware pre/post save, pre-find (hooks)
- ✅ Plugin personalizado de auditoría (versión + createdBy/updatedBy)
- ✅ Índices compuestos y de texto para optimización
- ✅ Agregaciones (getStats, getSummary, getUserStats)
- ✅ Métodos estáticos y de instancia
- ✅ Virtuals
- ✅ HTTPS con certificados autofirmados

### Comunicaciones Asíncronas (Criterio 3)
- ✅ Fetch API con autenticación JWT automática (Bearer token)
- ✅ Caché en memoria con TTL configurable
- ✅ Reintentos con backoff exponencial
- ✅ WebSockets con autenticación JWT en la conexión
- ✅ Canales multiplexados (offers, admin, categorías)
- ✅ Patrón PUB/SUB para notificaciones en tiempo real
- ✅ Reducción de tráfico (throttling, compresión, heartbeat)

### Roles Admin/Usuario (Criterio 4)
- ✅ RBAC con permisos granulares por rol
- ✅ Admin: gestión total (CRUD usuarios + todas las ofertas)
- ✅ User: solo puede gestionar sus propias ofertas
- ✅ Middleware de autorización en Express y GraphQL
- ✅ Verificación isOwnerOrAdmin para operaciones sobre recursos
- ✅ Contraseñas hasheadas con bcrypt (salt 12 rounds)
- ✅ Tokens JWT con expiración configurable

---

## 6. API GraphQL

Accesible en `/graphql`. Queries y mutations principales:

### Queries
- `obtenerOfertas(type, category, status, page, limit)` - Listado paginado
- `obtenerUsuarios` - Lista usuarios (solo admin)
- `obtenerPerfil` - Perfil del usuario autenticado
- `obtenerEstadisticas` - Stats por tipo/categoría
- `buscarOfertas(keyword)` - Búsqueda full-text

### Mutations
- `login(email, password)` - Autenticación
- `registro(username, email, password)` - Registro
- `crearOferta(...)` - Crear oferta/demanda (requiere auth)
- `eliminarOferta(id)` - Eliminar (propietario o admin)
- `eliminarUsuario(id)` - Desactivar usuario (solo admin)

---

## Mapa Conceptual
- Fullstack, Mongoose (Schema/Model/Middleware/Plugins)
- Fetch API, WebSockets/Socket.io, RBAC, JWT, HTTPS, PUB/SUB
- Flujo: Frontend (Fetch/Socket.io) → HTTPS → Express → GraphQL → Mongoose → MongoDB
