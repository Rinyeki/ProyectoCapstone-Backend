const express = require('express');
const pymesController = require('./infraestructura/rest/controller/pymeController');
const usuariosController = require('./infraestructura/rest/controller/usuarioController');
const authController = require('./infraestructura/rest/controller/authController');
const passport = require('passport');
const cors = require('cors');
const { setupAssociations } = require('./infraestructura/entities/index');
const { initDb } = require('./infraestructura/db/sequelize');

setupAssociations();
initDb().catch((err) => { console.error('DB init failed', err) });

const app = express();

app.use(express.json({ limit: '20mb' }));
const allowedOriginsRaw = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:4321';
const allowedOrigins = String(allowedOriginsRaw).split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const matchExact = allowedOrigins.includes(origin);
    const matchStar = allowedOrigins.includes('*');
    const matchWildcard = allowedOrigins.some((o) => {
      if (!o) return false;
      if (o.startsWith('*.')) {
        const suffix = o.slice(1);
        return origin.endsWith(suffix);
      }
      if (o.startsWith('https://*.')) {
        const suffix = o.replace('https://*', '');
        return origin.endsWith(suffix);
      }
      return false;
    });
    const ok = matchExact || matchStar || matchWildcard;
    cb(null, ok);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(passport.initialize());

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rutas REST
app.use('/pymes', pymesController.router);
app.use('/usuarios', usuariosController.router);
app.use('/auth', authController.router);

module.exports = app;
