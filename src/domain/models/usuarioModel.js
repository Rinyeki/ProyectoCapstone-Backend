class Usuario {
  constructor({ id, rut_chileno, nombre, correo, contraseña, rol }) {
    this.id = id;
    this.rut_chileno = rut_chileno;
    this.nombre = nombre;
    this.correo = correo;
    this.contraseña = contraseña;
    this.rol = rol;
  }
}

module.exports = { Usuario };