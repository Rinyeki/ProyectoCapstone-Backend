const { UsuariosRepository } = require('../../domain/ports/output/usuarioOutputport');
const { UsuarioEntity } = require('../entities/usuarioEntity');
const { PymeEntity } = require('../entities/pymeEntity');
const { UsuarioMapper } = require('../mapper/usuarioMapper');
const { PymeMapper } = require('../mapper/pymeMapper');

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
}

module.exports = { UsuarioSequelizeRepository };