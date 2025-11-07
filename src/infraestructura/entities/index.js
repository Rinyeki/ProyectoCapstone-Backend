const { UsuarioEntity } = require('./usuarioEntity');
const { PymeEntity } = require('./pymeEntity');

function setupAssociations() {
  PymeEntity.belongsTo(UsuarioEntity, {
    foreignKey: 'rut_chileno',
    targetKey: 'rut_chileno',
    as: 'usuario',
  });
}

module.exports = { UsuarioEntity, PymeEntity, setupAssociations };