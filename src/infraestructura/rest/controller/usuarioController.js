const express = require('express');
const { UsuarioUseCase } = require('../../../domain/usecase/usuarioUseCase');
const { UsuarioSequelizeRepository } = require('../../repository/usuarioRepository');
const { authenticateJWT, authorizeRole, authorizeSelfOrAdmin } = require('../../middleware/auth');
const { normalizeRut, isValidRut } = require('../../../domain/utils/rut');

const router = express.Router();

const repository = new UsuarioSequelizeRepository();
const useCase = new UsuarioUseCase(repository);

// Listar usuarios
// Solo admin puede listar usuarios
router.get('/', authenticateJWT, authorizeRole('administrador'), async (req, res) => {
  try {
    const usuarios = await useCase.list(req.query);
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Admin o el propio usuario puede ver su perfil
router.get('/:id', authenticateJWT, authorizeSelfOrAdmin('id'), async (req, res) => {
  try {
    const usuario = await useCase.getById(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

router.get('/:id/con-filtros', authenticateJWT, authorizeSelfOrAdmin('id'), async (req, res) => {
  try {
    const usuario = await useCase.getByIdWithFilters(req.params.id, req.query);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuario con filtros' });
  }
});

router.get('/:id/pymes', authenticateJWT, authorizeSelfOrAdmin('id'), async (req, res) => {
  try {
    const pymes = await useCase.getPymes(req.params.id, req.query);
    res.json(pymes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pymes del usuario' });
  }
});

// Crear usuario: solo admin
router.post('/', authenticateJWT, authorizeRole('administrador'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.rut_chileno) {
      data.rut_chileno = normalizeRut(data.rut_chileno);
      if (!isValidRut(data.rut_chileno)) {
        return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
      }
    }
    const creado = await useCase.create(data);
    res.status(201).json(creado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al crear usuario' });
  }
});

// Actualizar usuario: solo admin
router.put('/:id', authenticateJWT, authorizeRole('administrador'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.rut_chileno) {
      data.rut_chileno = normalizeRut(data.rut_chileno);
      if (!isValidRut(data.rut_chileno)) {
        return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
      }
    }
    const actualizado = await useCase.update(req.params.id, data);
    if (!actualizado) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(actualizado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario: solo admin
router.delete('/:id', authenticateJWT, authorizeRole('administrador'), async (req, res) => {
  try {
    const eliminado = await useCase.delete(req.params.id);
    if (!eliminado) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al eliminar usuario' });
  }
});

module.exports = { router };