const { UsuarioEntity } = require('./UsuarioEntity.js');
const { PymeEntity } = require('./PymeEntity.js');

function setupAssociations() {
  PymeEntity.belongsTo(UsuarioEntity, {
    foreignKey: 'rut_chileno',
    targetKey: 'rut_chileno',
    as: 'usuario',
  });
}

module.exports = { UsuarioEntity, PymeEntity, setupAssociations };