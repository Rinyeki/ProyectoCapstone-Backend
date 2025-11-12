const express = require('express');
const passport = require('passport');
const { configurePassport } = require('../../auth/passport');
const { signToken } = require('../../middleware/auth');
const { normalizeRut, isValidRut } = require('../../../domain/utils/rut');

const router = express.Router();
configurePassport();

// Login local
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info && info.message ? info.message : 'Credenciales inválidas' });
    const token = signToken(user);
    const requiresRut = !user.rut_chileno;
    return res.json({ token, requiresRut });
  })(req, res, next);
});

// Inicio flujo Google
router.get('/google', (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Callback Google
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info && info.message ? info.message : 'No autorizado' });
    const token = signToken(user);
    const requiresRut = !user.rut_chileno;
    return res.json({ token, requiresRut });
  })(req, res, next);
});

// Registro de usuario (self-signup)
const bcrypt = require('bcryptjs');
const { UsuarioEntity } = require('../../entities/usuarioEntity');
router.post('/register', async (req, res) => {
  try {
    let { correo, contraseña, nombre, rut_chileno, rol } = req.body;
    if (!correo || !contraseña || !nombre) {
      return res.status(400).json({ message: 'correo, contraseña y nombre son requeridos' });
    }
    const existing = await UsuarioEntity.findOne({ where: { correo } });
    if (existing) {
      return res.status(409).json({ message: 'Correo ya registrado' });
    }
    if (rut_chileno) {
      rut_chileno = normalizeRut(rut_chileno);
      if (!isValidRut(rut_chileno)) {
        return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
      }
      const rutExists = await UsuarioEntity.findOne({ where: { rut_chileno } });
      if (rutExists) return res.status(409).json({ message: 'RUT ya registrado' });
    }
    const hashed = await bcrypt.hash(contraseña, 10);
    const user = await UsuarioEntity.create({
      correo,
      contraseña: hashed,
      nombre,
      rut_chileno: rut_chileno || null,
      rol: rol === 'administrador' ? 'administrador' : 'usuario',
    });
    const token = signToken(user);
    const requiresRut = !user.rut_chileno;
    return res.status(201).json({ token, requiresRut });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al registrar usuario' });
  }
});

// Cambio de contraseña
const { authenticateJWT } = require('../../middleware/auth');
router.post('/change-password', authenticateJWT, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword y newPassword son requeridos' });
    }
    const user = await UsuarioEntity.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    let valid = false;
    try {
      valid = await bcrypt.compare(oldPassword, user.contraseña);
    } catch (e) {}
    if (!valid) valid = oldPassword === user.contraseña;
    if (!valid) return res.status(401).json({ message: 'Contraseña actual inválida' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ contraseña: hashed });
    return res.status(200).json({ message: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al cambiar contraseña' });
  }
});

// Establecer rut tras login (obligatorio si viene nulo)
router.post('/set-rut', authenticateJWT, async (req, res) => {
  try {
    let { rut_chileno } = req.body;
    if (!rut_chileno) return res.status(400).json({ message: 'rut_chileno requerido' });
    rut_chileno = normalizeRut(rut_chileno);
    if (!isValidRut(rut_chileno)) {
      return res.status(400).json({ message: 'RUT inválido. Formato esperado: 12345678-K' });
    }
    const user = await UsuarioEntity.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.rut_chileno) return res.status(409).json({ message: 'El RUT ya está asignado' });
    // Verificar unicidad
    const other = await UsuarioEntity.findOne({ where: { rut_chileno } });
    if (other) return res.status(409).json({ message: 'RUT ya registrado' });
    await user.update({ rut_chileno });
    return res.status(200).json({ message: 'RUT asignado' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al asignar RUT' });
  }
});

module.exports = { router };