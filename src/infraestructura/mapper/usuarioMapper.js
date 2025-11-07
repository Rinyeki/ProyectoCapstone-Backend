const { Usuario } = require('../../domain/models/usuarioModel');

const UsuarioMapper = {
  toDomain(entity) {
    if (!entity) return null;
    return new Usuario({
      id: entity.id,
      rut_chileno: entity.rut_chileno,
      nombre: entity.nombre,
      correo: entity.correo,
      contraseña: entity.contraseña,
      rol: entity.rol,
    });
  },
};

module.exports = { UsuarioMapper };