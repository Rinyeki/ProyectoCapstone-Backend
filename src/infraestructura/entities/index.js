const { UsuarioEntity } = require('./UsuarioEntity.js');
const { PymeEntity } = require('./PymeEntity.js');

function setupAssociations() {
  const assocExists = PymeEntity.associations && PymeEntity.associations.usuario
  if (!assocExists) {
    PymeEntity.belongsTo(UsuarioEntity, {
      foreignKey: 'rut_chileno',
      targetKey: 'rut_chileno',
      as: 'usuario',
    });
  }
}

module.exports = { UsuarioEntity, PymeEntity, setupAssociations };
