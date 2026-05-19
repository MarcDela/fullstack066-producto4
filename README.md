# Producto 4 — AgroJobs FullStack

Aplicación FullStack JS que evoluciona el Producto 3. Incluye frontend separado, backend GraphQL, MongoDB con Mongoose, autenticación JWT, roles ADMIN/USUARIO, Fetch API y comunicación asíncrona en tiempo real con Socket.io.

## Estructura

```txt
fullstack066-producto4/
├── backend/
│   ├── config/
│   ├── graphql/
│   ├── middleware/
│   ├── models/
│   ├── scripts/
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── css/
    ├── js/
    ├── img/
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Requisitos

- Node.js
- MongoDB local o MongoDB Atlas
- VS Code recomendado

## Instalación

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

En Linux/Mac usar:

```bash
cp .env.example .env
```

El backend queda en:

```txt
http://localhost:4000/graphql
```

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend queda en:

```txt
http://localhost:5173
```

## Usuarios de prueba

Después de ejecutar `npm run seed`:

```txt
ADMIN
email: admin@test.com
password: 123456

USUARIO
email: user@test.com
password: 123456
```

## Pruebas principales para la rúbrica

1. Abrir `http://localhost:4000/graphql` y comprobar queries/mutations.
2. Abrir `http://localhost:5173` y hacer login.
3. Crear ofertas y demandas desde el frontend.
4. Comprobar que el frontend usa `fetch` contra GraphQL.
5. Abrir dos pestañas del frontend y crear una oferta: la otra pestaña se actualiza por Socket.io.
6. Entrar como ADMIN y cargar usuarios.
7. Entrar como USUARIO y comprobar que no aparece la sección de usuarios.
8. Probar eliminar oferta/demanda: solo ADMIN puede hacerlo.

## Consultas GraphQL útiles

### Login

```graphql
mutation {
  login(email: "admin@test.com", password: "123456") {
    token
    usuario { id nombre email rol }
  }
}
```

### Ver ofertas

```graphql
query {
  obtenerOfertas {
    id
    titulo
    empresa
    ubicacion
    salario
    creadaPor { nombre rol }
  }
}
```

### Crear oferta con token

En Headers:

```json
{
  "Authorization": "Bearer PEGA_AQUI_TU_TOKEN"
}
```

Mutation:

```graphql
mutation {
  crearOferta(
    titulo: "Recolector de fruta"
    empresa: "Agro Zaragoza"
    ubicacion: "Zaragoza"
    descripcion: "Trabajo de temporada"
    salario: 1200
  ) {
    id
    titulo
  }
}
```

## Puntos de la rúbrica cubiertos

- Mongoose con esquemas, validaciones, hooks y relaciones.
- Backend GraphQL con Express.
- Autenticación JWT.
- Roles ADMIN y USUARIO.
- Fetch API desde el frontend.
- Socket.io para comunicación asíncrona en tiempo real.
- Código separado en frontend/backend.
- Proyecto preparado para Codesandbox o ejecución local.
