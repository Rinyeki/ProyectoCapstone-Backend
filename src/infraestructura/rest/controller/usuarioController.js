const express = require('express');
const { UsuarioUseCase } = require('../../../domain/usecase/usuarioUseCase');
const { UsuarioSequelizeRepository } = require('../../repository/usuarioRepository');

const router = express.Router();

const repository = new UsuarioSequelizeRepository();
const useCase = new UsuarioUseCase(repository);

router.get('/:id', async (req, res) => {
  try {
    const usuario = await useCase.getById(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

router.get('/:id/con-filtros', async (req, res) => {
  try {
    const usuario = await useCase.getByIdWithFilters(req.params.id, req.query);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuario con filtros' });
  }
});

router.get('/:id/pymes', async (req, res) => {
  try {
    const pymes = await useCase.getPymes(req.params.id, req.query);
    res.json(pymes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pymes del usuario' });
  }
});

module.exports = { router };