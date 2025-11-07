const { DataTypes, Model, Sequelize } = require('sequelize');
const { sequelize } = require('../db/sequelize');

class UsuarioEntity extends Model {}

UsuarioEntity.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    rut_chileno: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    correo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contraseña: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('administrador', 'usuario'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuario',
    timestamps: false,
  }
);

module.exports = { UsuarioEntity };