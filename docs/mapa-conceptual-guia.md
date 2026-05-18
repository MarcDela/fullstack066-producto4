# Guía para Dibujar el Mapa Conceptual a Mano

Dibuja esto en un folio A4 (horizontal). Usa colores si puedes.

---

## Estructura del Mapa

Pon **"FULLSTACK APP"** en el centro y dibuja ramas hacia cada concepto.

```
                            ┌─────────────┐
                            │  FRONTEND   │
                            │  (Client)   │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │ Fetch API │ │ Socket.io │ │  Session  │
              │           │ │  Client   │ │  (JWT)    │
              └─────┬─────┘ └─────┬─────┘ └───────────┘
                    │              │
                    │   Caché TTL  │   PUB/SUB
                    │   Reintentos │   Canales
                    │   Bearer JWT │   Throttling
                    │              │
         ═══════════╪══════════════╪═══════════════════
                    │    HTTPS     │
         ═══════════╪══════════════╪═══════════════════
                    │              │
              ┌─────▼──────────────▼─────┐
              │        EXPRESS.JS         │
              │     (Servidor Node.js)    │
              └─────┬──────────────┬─────┘
                    │              │
              ┌─────▼─────┐ ┌─────▼─────┐
              │  GraphQL  │ │ Socket.io │
              │  Apollo   │ │  Server   │
              └─────┬─────┘ └─────┬─────┘
                    │              │
                    │   Resolvers  │   JWT Auth
                    │   Queries    │   Rooms/Canales
                    │   Mutations  │   Eventos
                    │              │
              ┌─────▼──────────────▼─────┐
              │       MIDDLEWARE          │
              └─────┬──────────────┬─────┘
                    │              │
              ┌─────▼─────┐ ┌─────▼─────┐
              │   AUTH    │ │   RBAC    │
              │   (JWT)   │ │  (Roles)  │
              └─────┬─────┘ └─────┬─────┘
                    │              │
                    │  Generar     │  admin: todo
                    │  Verificar   │  user: lo suyo
                    │  bcrypt      │  Permisos
                    │              │
              ┌─────▼──────────────▼─────┐
              │        MONGOOSE          │
              │         (ODM)            │
              └─────┬──────────────┬─────┘
                    │              │
         ┌──────────┼──────────────┼──────────┐
         │          │              │          │
   ┌─────▼───┐ ┌───▼────┐ ┌──────▼──┐ ┌────▼─────┐
   │ Schemas │ │Middleware│ │ Plugins │ │Agregación│
   │         │ │ (Hooks) │ │         │ │          │
   └─────────┘ └─────────┘ └─────────┘ └──────────┘
   Validaciones  pre-save    auditPlugin  getStats()
   Índices       post-save   versión      getSummary()
   Virtuals      pre-find    createdBy    paginación
                    │
              ┌─────▼─────┐
              │  MongoDB  │
              │  Atlas    │
              └───────────┘
              Pool conexiones
              Escalable
              Cloud
```

---

## Conceptos que DEBEN aparecer (según la rúbrica)

Marca estos con un ✓ mientras dibujas:

- [ ] **Fullstack** (centro del mapa)
- [ ] **Mongoose** → Schema, Model, Middleware, Plugins
- [ ] **Fetch API** → Caché, Auth JWT, Reintentos
- [ ] **WebSockets / Socket.io** → Canales, PUB/SUB, Auth
- [ ] **RBAC** → Roles (admin/user), Permisos
- [ ] **JWT** → Token, Bearer, Expiración, bcrypt
- [ ] **HTTPS** → Certificados, Seguridad
- [ ] **PUB/SUB** → Eventos en tiempo real

---

## Flujo principal (dibuja flechas en este orden)

```
Frontend (Fetch/Socket.io)
        ↓
      HTTPS (certificados)
        ↓
    ExpressJS (servidor)
        ↓
  GraphQL (Apollo Server)
        ↓
   Mongoose (ODM)
        ↓
  MongoDB Atlas (cloud)
```

---

## Tips para el dibujo

1. **Centro**: "AgroJobs - Fullstack App"
2. **Arriba**: Frontend (Fetch + Socket.io + Session)
3. **Medio**: Express + GraphQL + Middleware (Auth + RBAC)
4. **Abajo**: Mongoose + MongoDB
5. **Izquierda**: Seguridad (HTTPS, JWT, bcrypt)
6. **Derecha**: Tiempo real (WebSocket, PUB/SUB, Canales)

Usa flechas para conectar los conceptos y escribe en cada flecha qué relación tienen (ej: "envía peticiones", "verifica token", "hashea password", etc.)
