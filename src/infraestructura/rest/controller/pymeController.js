const express = require('express');
const { PymeUseCase } = require('../../../domain/usecase/pymeUseCase');
const { PymeSequelizeRepository } = require('../../repository/pymeRepository');
const { authenticateJWT, authorizeRole, authorizePymeOwnershipOrAdmin } = require('../../middleware/auth');
const { normalizeRut, isValidRut } = require('../../../domain/utils/rut');

const router = express.Router();

const repository = new PymeSequelizeRepository();
const useCase = new PymeUseCase(repository);

// Listar pymes: solo admin (usuarios normales usan /usuarios/:id/pymes)
router.get('/', authenticateJWT, authorizeRole('administrador'), async (req, res) => {
  try {
    const pymes = await useCase.list(req.query);
    res.json(pymes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pymes' });
  }
});

// Obtener pyme por id
// Obtener pyme por id: admin o dueño
router.get('/:id', authenticateJWT, authorizePymeOwnershipOrAdmin, async (req, res) => {
  try {
    const pyme = await useCase.getById(req.params.id);
    if (!pyme) return res.status(404).json({ message: 'Pyme no encontrada' });
    res.json(pyme);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener pyme' });
  }
});

// Crear pyme
// Crear pyme: autenticado. Usuario normal solo crea para su propio rut_chileno
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const data = { ...req.body };
    // Si no es admin, fuerza propiedad
    if (req.user.rol !== 'administrador') {
      data.rut_chileno = req.user.rut_chileno;
      if (!data.rut_chileno) {
        return res.status(400).json({ message: 'Debe asignar su RUT antes de crear pymes' });
      }
    } else if (data.rut_chileno) {
      data.rut_chileno = normalizeRut(data.rut_chileno);
      if (!isValidRut(data.rut_chileno)) {
        return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
      }
    }
    // Validación de rut_empresa
    if (!data.rut_empresa) {
      return res.status(400).json({ message: 'rut_empresa es requerido' });
    }
    data.rut_empresa = normalizeRut(data.rut_empresa);
    if (!isValidRut(data.rut_empresa)) {
      return res.status(400).json({ message: 'RUT de empresa inválido. Formato esperado: 12345678-K' });
    }
    const creada = await useCase.create(data);
    res.status(201).json(creada);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al crear pyme' });
  }
});

// Actualizar pyme
// Actualizar pyme: admin o dueño
router.put('/:id', authenticateJWT, authorizePymeOwnershipOrAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    // Un usuario normal no puede transferir propiedad
    if (req.user.rol !== 'administrador') {
      delete data.rut_chileno;
    } else if (data.rut_chileno) {
      data.rut_chileno = normalizeRut(data.rut_chileno);
      if (!isValidRut(data.rut_chileno)) {
        return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
      }
    }
    if (data.rut_empresa) {
      data.rut_empresa = normalizeRut(data.rut_empresa);
      if (!isValidRut(data.rut_empresa)) {
        return res.status(400).json({ message: 'RUT de empresa inválido. Formato esperado: 12345678-K' });
      }
    }
    const actualizada = await useCase.update(req.params.id, data);
    if (!actualizada) return res.status(404).json({ message: 'Pyme no encontrada' });
    res.json(actualizada);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al actualizar pyme' });
  }
});

// Eliminar pyme
// Eliminar pyme: admin o dueño
router.delete('/:id', authenticateJWT, authorizePymeOwnershipOrAdmin, async (req, res) => {
  try {
    const eliminada = await useCase.delete(req.params.id);
    if (!eliminada) return res.status(404).json({ message: 'Pyme no encontrada' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al eliminar pyme' });
  }
});

module.exports = { router };