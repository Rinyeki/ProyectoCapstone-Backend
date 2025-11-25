const { UsuariosRepository } = require('../../domain/ports/output/usuarioOutputport');
const { UsuarioEntity, PymeEntity } = require('../entities/index');
const { UsuarioMapper } = require('../mapper/usuarioMapper');
const { PymeMapper } = require('../mapper/PymeMapper.js');
const bcrypt = require('bcryptjs');

class UsuarioSequelizeRepository extends UsuariosRepository {
  async findById(id) {
    const entity = await UsuarioEntity.findOne({ where: { id } });
    return UsuarioMapper.toDomain(entity);
  }

  async findByIdWithFilters(id, filters = {}) {
    const where = { id, ...filters };
    const entity = await UsuarioEntity.findOne({ where });
    return UsuarioMapper.toDomain(entity);
  }

  async findUserPymes(id, filters = {}) {
    const entities = await PymeEntity.findAll({
      include: [{ model: UsuarioEntity, as: 'usuario', where: { id } }],
      where: { ...filters },
      order: [['id', 'ASC']],
    });
    return PymeMapper.toDomainList(entities);
  }

  async findAll(filters = {}) {
    const { limit, offset, ...where } = filters || {}
    const query = {
      where,
      order: [['id', 'ASC']],
    }
    if (limit !== undefined) query.limit = Number(limit)
    if (offset !== undefined) query.offset = Number(offset)
    const entities = await UsuarioEntity.findAll(query)
    return entities.map(UsuarioMapper.toDomain)
  }

  async create(data) {
    const payload = { ...data };
    if (payload.contraseña) {
      payload.contraseña = await bcrypt.hash(payload.contraseña, 10);
    }
    const created = await UsuarioEntity.create(payload);
    return UsuarioMapper.toDomain(created);
  }

  async update(id, data) {
    const entity = await UsuarioEntity.findByPk(id);
    if (!entity) return null;
    const payload = { ...data };
    if (payload.contraseña) {
      payload.contraseña = await bcrypt.hash(payload.contraseña, 10);
    }
    await entity.update(payload);
    return UsuarioMapper.toDomain(entity);
  }

  async delete(id) {
    // Borrado en cascada: eliminar pymes asociadas por rut_chileno antes de eliminar usuario
    const user = await UsuarioEntity.findByPk(id);
    if (!user) return false;
    const rut = user.rut_chileno ? String(user.rut_chileno) : null;
    if (rut) {
      try {
        await PymeEntity.destroy({ where: { rut_chileno: rut } });
      } catch (e) {}
    }
    const count = await UsuarioEntity.destroy({ where: { id } });
    return count > 0;
  }
}

module.exports = { UsuarioSequelizeRepository };
