const { PymesRepository } = require('../../domain/ports/output/pymeOutputport');
const { PymeEntity } = require('../entities/pymeEntity');
const { UsuarioEntity } = require('../entities/usuarioEntity');
const { PymeMapper } = require('../mapper/pymeMapper');

class PymeSequelizeRepository extends PymesRepository {
  async findAll(filters = {}) {
    const entities = await PymeEntity.findAll({
      where: { ...filters },
      order: [['id', 'ASC']],
      include: [{ model: UsuarioEntity, as: 'usuario' }],
    });
    return PymeMapper.toDomainList(entities);
  }
}

module.exports = { PymeSequelizeRepository };