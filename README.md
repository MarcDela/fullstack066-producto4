# AgroJobs - Producto 4: Aplicación FullStack

Aplicación web fullstack de gestión de ofertas y demandas de empleo en el sector agrícola.  
**Frontend + API Backend con Mongoose, WebSockets, RBAC y HTTPS.**

---

## 🌐 5. Entrega

### 5.1 CodeSandbox

| Modo | URL |
|------|-----|
| **DevTool** | https://codesandbox.io/p/devbox/proyecto-agrojobs-p4-yjt3jy |
| **Sandbox (app en vivo)** | https://yjt3jy-4000.csb.app/ |

### 5.2 Vídeo explicativo

🎥 YouTube: https://youtu.be/6xGMJL0bweM

### 5.3 GitHub

📂 Repositorio común: https://github.com/MarcDela/fullstack066-producto4

---

## 🔐 Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | admin@agrojobs.com | 123456aA |
| **Candidato** | laura@correo.com | 123456aA |
| **Empresa** | rrhh@campogrande.com | 123456aA |

> El **Administrador** tiene acceso total (CRUD de usuarios, ofertas y demandas).  
> Los roles **Candidato** y **Empresa** solo pueden gestionar sus propias publicaciones.

---

## ⚙️ Tecnologías

- **Backend**: Node.js + Express + Apollo Server (GraphQL) + Mongoose + Socket.io
- **Frontend**: HTML5 + CSS3 + Bootstrap 5 + JavaScript (ES Modules)
- **Base de datos**: MongoDB Atlas (Mongoose ODM)
- **Autenticación**: JWT + bcrypt + RBAC (Role-Based Access Control)
- **Comunicación asíncrona**: Fetch API + WebSockets (Socket.io)
- **Seguridad**: HTTPS, JWT con expiración, roles y permisos

---

## 1. IA Generativa - Prompts Documentados

| # | IA utilizada | Prompt introducido | Resultado/Uso |
|---|---|---|---|
| 1 | Kiro (Claude) | "Migra el driver nativo de MongoDB a Mongoose con schemas, validaciones, middleware y plugins" | Migración a Mongoose con modelos Usuario, Oferta, Demanda |
| 2 | Kiro (Claude) | "Implementa comunicación asíncrona con Fetch API usando caché, autenticación JWT y manejo avanzado de errores" | Sistema Fetch en el frontend con JWT |
| 3 | Kiro (Claude) | "Configura Socket.io con autenticación JWT, canales multiplexados y patrón PUB/SUB para notificaciones en tiempo real" | WebSockets con Socket.io |
| 4 | Kiro (Claude) | "Implementa sistema de roles RBAC con middleware de autorización y permisos granulares en ExpressJS" | Sistema de roles (Administrador, Empresa, Candidato) |
| 5 | Kiro (Claude) | "Configura HTTPS en ExpressJS con certificados autofirmados para desarrollo local" | Seguridad HTTPS |

---

## 2. Estructura del Proyecto

```
producto4/
├── config/
│   └── db.js                  # Conexión Mongoose a MongoDB Atlas
├── models/
│   ├── Usuarios.js            # Schema con roles (enum) y validaciones
│   ├── Ofertas.js             # Schema con referencia a autor (ObjectId)
│   └── Demandas.js            # Schema con referencia a autor (ObjectId)
├── graphql/
│   ├── typeDefs.js            # Schema GraphQL (Types, Queries, Mutations, Subscriptions)
│   └── resolvers.js           # Resolvers con auth JWT + RBAC + Socket.io
├── client/
│   ├── index.html             # Dashboard principal
│   ├── login.html             # Login con JWT
│   ├── ofertas.html           # CRUD ofertas/demandas
│   ├── usuarios.html          # Gestión de usuarios (admin)
│   ├── css/style.css
│   ├── img/
│   └── js/
│       ├── almacenaje.js      # Gestión de sesión y storage
│       ├── int_1_landing.js   # Dashboard con drag & drop
│       ├── int_2_login.js     # Login con Fetch + JWT
│       ├── int_3_empleos.js   # CRUD ofertas con Fetch + Socket.io
│       └── int_4_usuarios.js  # CRUD usuarios (admin)
├── index.js                   # Servidor Express + Apollo + Socket.io
├── .env.example               # Variables de entorno (plantilla)
├── package.json
└── README.md
```

---

## 3. Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Copiar .env.example a .env y rellenar con tus credenciales
cp .env.example .env

# 3. Arrancar el servidor
npm start
# o en modo desarrollo:
npm run dev
```

El servidor arranca en `http://localhost:4000`.  
GraphQL Playground disponible en `http://localhost:4000/graphql`.

---

## 4. Características Implementadas

### Backend con Mongoose (Criterio 2)
- ✅ Conexión a MongoDB Atlas con Mongoose
- ✅ Schemas con validaciones (required, unique, enum)
- ✅ Sistema de roles con enum (Administrador, Empresa, Candidato)
- ✅ Referencias entre colecciones (autorId → Usuario)
- ✅ Modelos separados: Usuario, Oferta, Demanda

### Comunicaciones Asíncronas (Criterio 3)
- ✅ Fetch API con autenticación JWT (Bearer token)
- ✅ WebSockets con Socket.io para notificaciones en tiempo real
- ✅ Eventos en tiempo real al crear/eliminar ofertas y demandas
- ✅ GraphQL Subscriptions configuradas

### Roles Admin/Usuario (Criterio 4)
- ✅ Autenticación con JWT (jsonwebtoken)
- ✅ Roles: Administrador, Empresa, Candidato
- ✅ Control de acceso en resolvers (verificación de token y rol)
- ✅ Administrador: gestión total de usuarios y publicaciones
- ✅ Empresa/Candidato: solo pueden gestionar sus propias publicaciones

---

## Mapa Conceptual

*(Incluir foto/escaneo del mapa conceptual dibujado a mano)*

Conceptos incluidos:
- Fullstack, Mongoose (Schema/Model/Validaciones)
- Fetch API, WebSockets/Socket.io, RBAC, JWT, HTTPS, PUB/SUB
- Flujo: Frontend (Fetch/Socket.io) → Express → GraphQL → Mongoose → MongoDB Atlas
