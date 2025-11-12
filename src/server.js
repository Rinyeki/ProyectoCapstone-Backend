const app = require('./app');
const { initDb } = require('./infraestructura/db/sequelize');
const { setupAssociations, UsuarioEntity, PymeEntity } = require('./infraestructura/entities/index');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    setupAssociations();
    await initDb();
    // Seed básico si la tabla de usuarios está vacía
    const uCount = await UsuarioEntity.count();
    if (uCount === 0) {
      await UsuarioEntity.create({
        rut_chileno: '12345678-9',
        nombre: 'Usuario Demo',
        correo: 'demo@correo.cl',
        contraseña: 'secret',
        rol: 'usuario',
      });
    }
    const pCount = await PymeEntity.count();
    if (pCount === 0) {
      await PymeEntity.create({
        nombre: 'Pyme Demo',
        rut_empresa: '76123456-7',
        descripcion: 'Descripción de demo',
        rut_chileno: '12345678-9',
        estado: 'activo',
      });
    }

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error inicializando DB', err);
    process.exit(1);
  }
})();
// Cargar variables de entorno desde .env si existe
require('dotenv').config();