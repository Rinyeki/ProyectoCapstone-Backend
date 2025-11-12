const { Pyme } = require('../../domain/models/pymeModel');
const { Usuario } = require('../../domain/models/usuarioModel');

const PymeMapper = {
  toDomain(entity) {
    if (!entity) return null;
    const usuario = entity.usuario
      ? new Usuario({
          id: entity.usuario.id,
          rut_chileno: entity.usuario.rut_chileno,
          nombre: entity.usuario.nombre,
          correo: entity.usuario.correo,
          contraseña: entity.usuario.contraseña,
          rol: entity.usuario.rol,
        })
      : null;

    return new Pyme({
      id: entity.id,
      nombre: entity.nombre,
      rut_empresa: entity.rut_empresa,
      descripcion: entity.descripcion,
      rut_chileno: entity.rut_chileno,
      longitud: entity.longitud,
      imagenes_url: entity.imagenes_url,
      fecha_creacion: entity.fecha_creacion,
      fecha_actualizacion: entity.fecha_actualizacion,
      telefono: entity.telefono,
      direccion: entity.direccion,
      comuna: entity.comuna,
      tipo_servicio: entity.tipo_servicio,
      tipo_atencion: entity.tipo_atencion,
      etiquetas: entity.etiquetas,
      horario_atencion: entity.horario_atencion,
      sitio_web: entity.sitio_web,
      redes: entity.redes,
      estado: entity.estado,
      usuario,
    });
  },
  toDomainList(entities) {
    return entities.map(PymeMapper.toDomain);
  },
};

module.exports = { PymeMapper };

