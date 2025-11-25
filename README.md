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

## Endpoints

Autenticación (`/auth`):
- `POST /auth/login` – Login local, devuelve JWT y `requiresRut`.
- `GET /auth/google` – Inicio de OAuth Google.
- `GET /auth/google/callback` – Callback de OAuth Google, devuelve JWT.
- `POST /auth/register` – Registro self-signup.
- `POST /auth/change-password` – Cambia contraseña (JWT).
- `POST /auth/request-email-change` – Solicita cambio de correo, envía token al correo actual (JWT, cooldown 30s, `429` con `Retry-After` si aplica).
- `POST /auth/confirm-email-change` – Confirma cambio de correo con token (JWT). Envía confirmación al correo nuevo y aviso al anterior.
- `PATCH /auth/update-name` – Actualiza nombre (JWT).
- `POST /auth/set-rut` – Establece RUT luego de login si está vacío (JWT).

Usuarios (`/usuarios`):
- `GET /usuarios` – Lista usuarios (admin).
- `GET /usuarios/:id` – Obtiene usuario por id (self o admin).
- `GET /usuarios/:id/con-filtros` – Obtiene usuario por id aplicando filtros (self o admin).
- `GET /usuarios/:id/pymes` – Lista pymes del usuario (self o admin).
- `POST /usuarios` – Crea usuario (admin).
- `PUT /usuarios/:id` – Actualiza usuario (admin).
- `DELETE /usuarios/:id` – Elimina usuario (admin).

Pymes (`/pymes`):
- `GET /pymes` – Lista pymes (admin).
- `GET /pymes/:id` – Obtiene pyme por id (admin o dueño).
- `POST /pymes` – Crea pyme (autenticado; usuarios normales crean para su propio `rut_chileno`).
- `PUT /pymes/:id` – Actualiza pyme (admin o dueño).
- `DELETE /pymes/:id` – Elimina pyme (admin o dueño).

Campos de Pyme relevantes para ubicación:
- `comuna`: comuna principal donde opera físicamente la pyme (string).
- `comunas_cobertura`: comunas adicionales donde la pyme ofrece entrega/atención (JSON array de strings). Acepta string o array en la API y se normaliza a array.

Ejemplo `POST /pymes` payload:
```
{
  "nombre": "Panadería Las Delicias",
  "rut_empresa": "12.345.678-5",
  "rut_chileno": "12.345.678-5",
  "comuna": "Santiago",
  "comunas_cobertura": ["Providencia", "Ñuñoa"],
  "tipo_atencion": ["Presencial", "A Domicilio"],
  "tipo_servicio": ["Panadería", "Pastelería"]
}
```

Notas:
- Autenticación JWT: enviar `Authorization: Bearer <token>`.
- El JWT incluye `id`, `rol`, `rut_chileno`, `correo`, `nombre`.
- SMTP para correos: configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `FROM_EMAIL`. Para Gmail: `587` con `SMTP_SECURE=false` (STARTTLS) o `465` con `SMTP_SECURE=true`.
- Cooldown de reenvío de token de cambio de correo: 30s; respuesta `429` incluye cabecera `Retry-After`.