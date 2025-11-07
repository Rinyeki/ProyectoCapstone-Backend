const express = require('express');
const pymesController = require('./infraestructura/rest/controller/pymeController');
const usuariosController = require('./infraestructura/rest/controller/usuarioController');

const app = express();

app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rutas REST
app.use('/pymes', pymesController.router);
app.use('/usuarios', usuariosController.router);

module.exports = app;