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
      allowNull: true,
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
    // Campos de verificación para cambios sensibles vía correo
    email_change_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email_change_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_change_new: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password_change_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password_change_expires: {
      type: DataTypes.DATE,
      allowNull: true,
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