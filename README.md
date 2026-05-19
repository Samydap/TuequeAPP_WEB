# TruequeApp Frontend

Frontend Angular 21 integrado con la API de TruequeApp (Node.js + Express + MongoDB).

## Estructura del proyecto

```
src/app/
├── components/
│   ├── auth/
│   │   ├── login/          → POST /api/auth/login
│   │   └── registro/       → POST /api/auth/registro
│   ├── navbar/             → Navegación + logout
│   ├── articulos/          → GET/POST /api/articulos
│   ├── categorias/         → CRUD /api/categorias
│   ├── intercambios/       → CRUD /api/intercambios
│   └── usuarios/           → GET/PUT/DELETE /api/usuarios
├── services/
│   ├── auth.service.ts
│   ├── auth.interceptor.ts → Adjunta JWT en cada request
│   ├── articulo.service.ts
│   ├── categoria.service.ts
│   ├── intercambio.service.ts
│   └── usuario.service.ts
└── guards/
    └── auth.guard.ts       → Protege rutas privadas
```

## Endpoints consumidos

| Módulo        | Método | Endpoint                       | Auth  |
|---------------|--------|--------------------------------|-------|
| Auth          | POST   | /api/auth/registro             | No    |
| Auth          | POST   | /api/auth/login                | No    |
| Artículos     | GET    | /api/articulos                 | No    |
| Artículos     | POST   | /api/articulos                 | JWT   |
| Artículos     | PUT    | /api/articulos/:id             | JWT   |
| Artículos     | DELETE | /api/articulos/:id             | JWT   |
| Categorías    | GET    | /api/categorias                | No    |
| Categorías    | POST   | /api/categorias                | JWT   |
| Categorías    | PUT    | /api/categorias/:id            | JWT   |
| Categorías    | DELETE | /api/categorias/:id            | JWT   |
| Intercambios  | GET    | /api/intercambios              | JWT   |
| Intercambios  | POST   | /api/intercambios              | JWT   |
| Intercambios  | PUT    | /api/intercambios/:id          | JWT   |
| Intercambios  | DELETE | /api/intercambios/:id          | JWT   |
| Usuarios      | GET    | /api/usuarios                  | JWT   |
| Usuarios      | PUT    | /api/usuarios/:id              | JWT   |
| Usuarios      | DELETE | /api/usuarios/:id              | JWT   |

## Instalación y ejecución

```bash
# 1. Instalar dependencias del frontend
npm install

# 2. Iniciar la API (en otra terminal, desde TruequeApp_API/)
node index.js   # corre en puerto 4040

# 3. Iniciar el frontend con proxy hacia la API
npm start       # ng serve --proxy-config proxy.conf.json
```

El proxy en `proxy.conf.json` redirige `/api/*` → `http://localhost:4040`.
