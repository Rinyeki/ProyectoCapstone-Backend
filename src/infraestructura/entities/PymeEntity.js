const { DataTypes, Model, Sequelize } = require('sequelize');
const { sequelize } = require('../db/sequelize');

class PymeEntity extends Model {}

PymeEntity.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rut_empresa: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rut_chileno: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longitud: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imagenes_url: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    telefono: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comuna: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo_servicio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo_atencion: {
      type: DataTypes.ENUM('Presencial', 'A Domicilio', 'Online'),
      allowNull: true,
    },
    etiquetas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    horario_atencion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sitio_web: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    redes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('activo', 'pendiente', 'rechazado'),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Pyme',
    tableName: 'pymes',
    timestamps: false,
  }
);

module.exports = { PymeEntity };