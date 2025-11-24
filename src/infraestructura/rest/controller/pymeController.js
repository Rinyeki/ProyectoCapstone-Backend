const express = require('express');
const { PymeUseCase } = require('../../../domain/usecase/pymeUseCase');
const { PymeSequelizeRepository } = require('../../repository/pymeRepository');
const { authenticateJWT, authorizeRole, authorizePymeOwnershipOrAdmin } = require('../../middleware/auth');
const { normalizeRut, isValidRut } = require('../../../domain/utils/rut');

const router = express.Router();

const repository = new PymeSequelizeRepository();
const useCase = new PymeUseCase(repository);

// Listar pymes: solo admin (usuarios normales usan /usuarios/:id/pymes)
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
    // Si no es admin, fuerza propiedad (si el token no trae rut, reconsulta en DB)
    if (req.user.rol !== 'administrador') {
      data.rut_chileno = req.user.rut_chileno;
      if (!data.rut_chileno) {
        try {
          const { UsuarioEntity } = require('../../entities/index');
          const u = await UsuarioEntity.findByPk(req.user.id);
          if (u && u.rut_chileno) data.rut_chileno = u.rut_chileno;
        } catch {}
      }
      if (!data.rut_chileno) {
        return res.status(400).json({ message: 'Debe asignar su RUT antes de crear pymes' });
      }
    } else if (data.rut_chileno) {
      data.rut_chileno = normalizeRut(data.rut_chileno);
      if (!isValidRut(data.rut_chileno)) {
        return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
      }
    }
    // Tipo: independiente o empresa
    const esIndependiente = String(data.es_independiente || '').toLowerCase() === 'true' || data.es_independiente === true;
    if (esIndependiente) {
      if (!data.rut_chileno) {
        return res.status(400).json({ message: 'rut_chileno requerido para pyme independiente' });
      }
      data.rut_empresa = data.rut_chileno;
    }
    // Validación de rut_empresa (requerido siempre, pero puede venir del propio rut si es independiente)
    if (!data.rut_empresa) {
      return res.status(400).json({ message: 'rut_empresa es requerido' });
    }
    data.rut_empresa = normalizeRut(data.rut_empresa);
    if (!isValidRut(data.rut_empresa)) {
      return res.status(400).json({ message: 'RUT de empresa inválido. Formato esperado: 12345678-K' });
    }
    // Normalización: aceptar string o array y guardar en campos múltiples
    const permitidosAtencion = ['Presencial', 'A Domicilio', 'Online'];
    if (data.tipo_atencion) {
      const toArray = Array.isArray(data.tipo_atencion) ? data.tipo_atencion : [data.tipo_atencion];
      const mapped = toArray.map((v) => String(v).trim());
      for (const v of mapped) {
        if (!permitidosAtencion.includes(v)) {
          return res.status(400).json({ message: `tipo_atencion inválido: ${v}. Permitidos: ${permitidosAtencion.join(', ')}` });
        }
      }
      data.tipo_atencion = mapped;
    }
    if (data.tipo_servicio) {
      const toArray = Array.isArray(data.tipo_servicio) ? data.tipo_servicio : [data.tipo_servicio];
      data.tipo_servicio = toArray.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    // Normalización para comunas_cobertura (JSONB array de strings)
    if (data.comunas_cobertura) {
      const toArray = Array.isArray(data.comunas_cobertura) ? data.comunas_cobertura : [data.comunas_cobertura];
      data.comunas_cobertura = toArray
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0);
    }
    // Normalización para etiquetas (JSONB): aceptar array u string
    if (data.etiquetas) {
      if (Array.isArray(data.etiquetas)) {
        data.etiquetas = data.etiquetas.map((v) => String(v).trim()).filter((v) => v.length > 0);
      } else if (typeof data.etiquetas === 'string') {
        const s = data.etiquetas.trim();
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            data.etiquetas = parsed.map((v) => String(v).trim()).filter((v) => v.length > 0);
          } else {
            // Si es objeto u otro JSON, lo guardamos tal cual
            data.etiquetas = parsed;
          }
        } catch {
          // Split por comas si no es JSON
          data.etiquetas = s.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
        }
      }
      // Otros tipos (objeto) se guardan tal cual en JSONB
    }
    // Normalización para redes (JSONB): preferir objeto; intentar parse si viene string
    if (data.redes) {
      if (typeof data.redes === 'string') {
        const s = data.redes.trim();
        try {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object') {
            data.redes = parsed;
          } else {
            return res.status(400).json({ message: 'redes debe ser un objeto o JSON válido' });
          }
        } catch {
          return res.status(400).json({ message: 'redes debe ser un objeto o JSON válido' });
        }
      } else if (Array.isArray(data.redes)) {
        return res.status(400).json({ message: 'redes debe ser un objeto' });
      }
    }
    const creada = await useCase.create(data);
    res.status(201).json(creada);
  } catch (err) {
    console.error(err);
    if (err && (err.name === 'SequelizeUniqueConstraintError' || String(err.message||'').includes('unique'))) {
      return res.status(409).json({ message: 'RUT de empresa ya registrado' });
    }
    const d = err && err.parent && err.parent.detail ? String(err.parent.detail) : err && err.message ? String(err.message) : undefined;
    res.status(400).json({ message: 'Error al crear pyme', detail: d });
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
    // Normalización: aceptar string o array y guardar en campos múltiples
    const permitidosAtencion2 = ['Presencial', 'A Domicilio', 'Online'];
    if (data.tipo_atencion) {
      const toArray = Array.isArray(data.tipo_atencion) ? data.tipo_atencion : [data.tipo_atencion];
      const mapped = toArray.map((v) => String(v).trim());
      for (const v of mapped) {
        if (!permitidosAtencion2.includes(v)) {
          return res.status(400).json({ message: `tipo_atencion inválido: ${v}. Permitidos: ${permitidosAtencion2.join(', ')}` });
        }
      }
      data.tipo_atencion = mapped;
    }
    if (data.tipo_servicio) {
      const toArray = Array.isArray(data.tipo_servicio) ? data.tipo_servicio : [data.tipo_servicio];
      data.tipo_servicio = toArray.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    // Normalización para comunas_cobertura (JSONB array de strings)
    if (data.comunas_cobertura) {
      const toArray = Array.isArray(data.comunas_cobertura) ? data.comunas_cobertura : [data.comunas_cobertura];
      data.comunas_cobertura = toArray
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0);
    }
    // Normalización para etiquetas (JSONB)
    if (data.etiquetas) {
      if (Array.isArray(data.etiquetas)) {
        data.etiquetas = data.etiquetas.map((v) => String(v).trim()).filter((v) => v.length > 0);
      } else if (typeof data.etiquetas === 'string') {
        const s = data.etiquetas.trim();
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            data.etiquetas = parsed.map((v) => String(v).trim()).filter((v) => v.length > 0);
          } else {
            data.etiquetas = parsed;
          }
        } catch {
          data.etiquetas = s.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
        }
      }
    }
    // Normalización para redes (JSONB)
    if (data.redes) {
      if (typeof data.redes === 'string') {
        const s = data.redes.trim();
        try {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object') {
            data.redes = parsed;
          } else {
            return res.status(400).json({ message: 'redes debe ser un objeto o JSON válido' });
          }
        } catch {
          return res.status(400).json({ message: 'redes debe ser un objeto o JSON válido' });
        }
      } else if (Array.isArray(data.redes)) {
        return res.status(400).json({ message: 'redes debe ser un objeto' });
      }
    }
    const actualizada = await useCase.update(req.params.id, data);
    if (!actualizada) return res.status(404).json({ message: 'Pyme no encontrada' });
    res.json(actualizada);
  } catch (err) {
    console.error(err);
    const d = err && err.parent && err.parent.detail ? String(err.parent.detail) : err && err.message ? String(err.message) : undefined;
    res.status(400).json({ message: 'Error al actualizar pyme', detail: d });
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