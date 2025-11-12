const express = require('express');
const pymesController = require('./infraestructura/rest/controller/pymeController');
const usuariosController = require('./infraestructura/rest/controller/usuarioController');
const authController = require('./infraestructura/rest/controller/authController');
const passport = require('passport');

const app = express();

app.use(express.json());
app.use(passport.initialize());

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rutas REST
app.use('/pymes', pymesController.router);
app.use('/usuarios', usuariosController.router);
app.use('/auth', authController.router);

module.exports = app;