class Pyme {
  constructor(props) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.rut_empresa = props.rut_empresa;
    this.descripcion = props.descripcion;
    this.rut_chileno = props.rut_chileno;
    this.longitud = props.longitud;
    this.imagenes_url = props.imagenes_url;
    this.fecha_creacion = props.fecha_creacion;
    this.fecha_actualizacion = props.fecha_actualizacion;
    this.telefono = props.telefono;
    this.direccion = props.direccion;
    this.comuna = props.comuna;
    this.tipo_servicio = props.tipo_servicio;
    this.tipo_atencion = props.tipo_atencion;
    this.etiquetas = props.etiquetas;
    this.horario_atencion = props.horario_atencion;
    this.sitio_web = props.sitio_web;
    this.redes = props.redes;
    this.estado = props.estado;
    this.usuario = props.usuario || null;
  }
}

module.exports = { Pyme };