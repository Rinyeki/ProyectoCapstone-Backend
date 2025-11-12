const { PymesRepository } = require('../../domain/ports/output/pymeOutputport');
const { PymeEntity, UsuarioEntity } = require('../entities/index');
const { PymeMapper } = require('../mapper/pymeMapper');
const { normalizeRut } = require('../../domain/utils/rut');

class PymeSequelizeRepository extends PymesRepository {
  async findAll(filters = {}) {
    const entities = await PymeEntity.findAll({
      where: { ...filters },
      order: [['id', 'ASC']],
      include: [{ model: UsuarioEntity, as: 'usuario' }],
    });
    return PymeMapper.toDomainList(entities);
  }

  async findById(id) {
    const entity = await PymeEntity.findByPk(id, {
      include: [{ model: UsuarioEntity, as: 'usuario' }],
    });
    return PymeMapper.toDomain(entity);
  }

  async create(data) {
    const payload = {
      ...data,
      fecha_creacion: data.fecha_creacion || new Date(),
      fecha_actualizacion: new Date(),
    };
    if (payload.rut_empresa) payload.rut_empresa = normalizeRut(payload.rut_empresa);
    if (payload.rut_chileno) payload.rut_chileno = normalizeRut(payload.rut_chileno);
    const created = await PymeEntity.create(payload);
    const entity = await PymeEntity.findByPk(created.id, {
      include: [{ model: UsuarioEntity, as: 'usuario' }],
    });
    return PymeMapper.toDomain(entity);
  }

  async update(id, data) {
    const entity = await PymeEntity.findByPk(id);
    if (!entity) return null;
    const payload = { ...data, fecha_actualizacion: new Date() };
    if (payload.rut_empresa) payload.rut_empresa = normalizeRut(payload.rut_empresa);
    if (payload.rut_chileno) payload.rut_chileno = normalizeRut(payload.rut_chileno);
    await entity.update(payload);
    const reloaded = await PymeEntity.findByPk(id, {
      include: [{ model: UsuarioEntity, as: 'usuario' }],
    });
    return PymeMapper.toDomain(reloaded);
  }

  async delete(id) {
    const count = await PymeEntity.destroy({ where: { id } });
    return count > 0;
  }
}

module.exports = { PymeSequelizeRepository };