# ProyectoCapstone

Arquitectura hexagonal (Clean Architecture) con Node.js, Express y Sequelize.

## Estructura

```
src/
  app.js                # Configuración de Express y rutas
  server.js             # Arranque del servidor y bootstrap de DB
  domain/
    models/             # Modelos de dominio (sin detalles de persistencia)
    ports/
      input/            # Contratos de casos de uso
      output/           # Contratos de repositorios
    usecase/            # Implementaciones de casos de uso
    utils/              # Utilidades de dominio
  infraestructura/
    db/                 # Configuración de Sequelize (Postgres)
    entities/           # Modelos Sequelize (Pyme, Usuario)
    mapper/             # Mappers entidad ⇄ dominio
    repository/         # Implementaciones de repositorios
    rest/
      controller/       # Controladores Express dentro de infraestructura
```

## Requisitos

- Node.js 18+
- Base de datos Postgres accesible (ej. Vercel Postgres)

## Instalación y ejecución

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar variables de entorno (ver `.env.example`).

3. Ejecutar en desarrollo (con nodemon):

   ```bash
   npm run dev
   ```

4. Producción/simple:

   ```bash
   npm start
   ```

La base de datos usa Postgres y se configura con variables de entorno.

### Variables de entorno

```
DB_NAME=nombre_base
DB_USER=usuario
DB_PASSWORD=contraseña
DB_HOST=host
DB_PORT=5432
```

## Endpoints

- `GET /health` – Healthcheck.
- `GET /pymes` – Lista pymes desde la base de datos.