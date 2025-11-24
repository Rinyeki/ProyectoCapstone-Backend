const express = require('express');
const passport = require('passport');
const nodemailer = require('nodemailer');
const { configurePassport } = require('../../auth/passport');
const { signToken } = require('../../middleware/auth');
const { normalizeRut, isValidRut } = require('../../../domain/utils/rut');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { UsuarioEntity } = require('../../entities/index');

const router = express.Router();
configurePassport();

// Configuración de Nodemailer usando variables de entorno
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE ("true"/"false"), FROM_EMAIL
let mailTransport = null;
function getMailTransport() {
  if (mailTransport) return mailTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_DEBUG } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null; // Sin configuración SMTP
  }
  const port = Number(SMTP_PORT);
  // Determinar secure automáticamente si no está definido claramente
  const secureFlagEnv = String(SMTP_SECURE || '').trim().toLowerCase();
  const secure = secureFlagEnv === 'true' ? true : secureFlagEnv === 'false' ? false : port === 465;
  const useRequireTLS = !secure && (port === 587 || port === 25);
  const transportOpts = {
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    requireTLS: useRequireTLS,
    tls: { minVersion: 'TLSv1.2' },
    logger: SMTP_DEBUG === 'true',
    debug: SMTP_DEBUG === 'true',
  };
  mailTransport = nodemailer.createTransport(transportOpts);
  return mailTransport;
}

async function sendVerificationEmail({ to, subject, text, html }) {
  const transporter = getMailTransport();
  if (!transporter) return { sent: false, reason: 'SMTP no configurado' };
  const from = process.env.FROM_EMAIL || 'no-reply@example.com';
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error enviando correo:', err);
    return { sent: false, reason: 'Fallo al enviar correo', error: err };
  }
}

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
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ message: 'Google OAuth no configurado' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Callback Google
router.get('/google/callback', async (req, res, next) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ message: 'Google OAuth no configurado' });
  }
  const direct = String(req.query.direct || '').trim();
  const front = String(req.query.front || '').trim();
  if (direct === '1') {
    try {
      const code = req.query.code;
      if (!code) return res.status(400).json({ message: 'code requerido' });
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: String(code),
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_CALLBACK_URL || 'http://localhost:4321/auth/google/callback',
      });
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok || !tokenJson.access_token) {
        return res.status(401).json({ message: 'No autorizado' });
      }
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      const profile = await infoRes.json();
      const emailRaw = profile && profile.email ? profile.email : null;
      if (!emailRaw) return res.status(401).json({ message: 'Google no entregó correo' });
      const email = String(emailRaw).toLowerCase();
      let user = await UsuarioEntity.findOne({ where: { correo: email } });
      if (!user) {
        const displayName = profile.name || email.split('@')[0];
        const random = crypto.randomBytes(16).toString('hex');
        const hashed = await bcrypt.hash(random, 10);
        user = await UsuarioEntity.create({
          correo: email,
          contraseña: hashed,
          nombre: displayName,
          rut_chileno: null,
          rol: 'usuario',
        });
      }
      const token = signToken(user);
      const requiresRut = !user.rut_chileno;
      if (front === '1') {
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Google Login</title></head><body>
<script>
  (function(){
    try { if (window.opener) { window.opener.postMessage({ type: 'auth', token: '${token}', requiresRut: ${requiresRut} }, '*'); } } catch(e) {}
    try { window.close(); } catch(e) { location.href = '/'; }
  })();
</script>
</body></html>`;
        return res.status(200).send(html);
      }
      return res.json({ token, requiresRut });
    } catch (err) {
      return res.status(500).json({ message: 'Error en intercambio de código' });
    }
  }
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info && info.message ? info.message : 'No autorizado' });
    const token = signToken(user);
    const requiresRut = !user.rut_chileno;
    if (front === '1') {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Google Login</title></head><body>
<script>
(function(){
  try { if (window.opener) { window.opener.postMessage({ type: 'auth', token: '${token}', requiresRut: ${requiresRut} }, '*'); } } catch(e) {}
  try { window.close(); } catch(e) { location.href = '/'; }
})();
</script>
</body></html>`;
      return res.status(200).send(html);
    }
    return res.json({ token, requiresRut });
  })(req, res, next);
});

// Registro de usuario (self-signup)
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

// Solicitar cambio de correo (envía token de verificación al correo actual)
router.post('/request-email-change', authenticateJWT, async (req, res) => {
  try {
    const { nuevo_correo } = req.body;
    if (!nuevo_correo) return res.status(400).json({ message: 'nuevo_correo es requerido' });
    const user = await UsuarioEntity.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    // Cooldown de 30 segundos para evitar spam de envío
    const COOLDOWN_MS = 30 * 1000;
    if (user.email_change_last_sent) {
      const diff = Date.now() - new Date(user.email_change_last_sent).getTime();
      if (diff < COOLDOWN_MS) {
        const retryAfterSec = Math.ceil((COOLDOWN_MS - diff) / 1000);
        res.set('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          message: `Debes esperar ${retryAfterSec} segundos antes de solicitar otro token`,
          retryAfterSeconds: retryAfterSec,
        });
      }
    }
    const newEmail = String(nuevo_correo).toLowerCase().trim();
    if (newEmail === user.correo) return res.status(400).json({ message: 'El nuevo correo es igual al actual' });
    const exists = await UsuarioEntity.findOne({ where: { correo: newEmail } });
    if (exists) return res.status(409).json({ message: 'Correo ya registrado' });
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await user.update({ email_change_new: newEmail, email_change_token: token, email_change_expires: expires, email_change_last_sent: new Date() });
    // Enviar correo real al correo actual con el token
    const subject = 'Verificación de cambio de correo';
    const text = `Hola ${user.nombre || ''},\n\n` +
      `Solicitaste cambiar tu correo a: ${newEmail}.\n` +
      `Usa este token para confirmar: ${token}\n` +
      `Este token expira a las ${expires.toISOString()}.\n\n` +
      `Si no solicitaste este cambio, ignora este mensaje.`;
    const html = `<p>Hola ${user.nombre || ''},</p>
      <p>Solicitaste cambiar tu correo a: <b>${newEmail}</b>.</p>
      <p>Usa este token para confirmar: <code>${token}</code></p>
      <p>Este token expira a las <b>${expires.toISOString()}</b>.</p>
      <p>Si no solicitaste este cambio, ignora este mensaje.</p>`;
    const mail = await sendVerificationEmail({ to: user.correo, subject, text, html });
    const response = { message: 'Token de verificación generado', expiresAt: user.email_change_expires };
    if (process.env.NODE_ENV !== 'production') response.debugToken = token;
    if (!mail || !mail.sent) {
      response.email = { sent: false, reason: (mail && mail.reason) || 'No enviado' };
      // En producción, si falla el envío, devolver 500
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ message: 'No se pudo enviar el correo de verificación' });
      }
    } else {
      response.email = { sent: true };
    }
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al solicitar cambio de correo' });
  }
});

// Confirmar cambio de correo (requiere token)
router.post('/confirm-email-change', authenticateJWT, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token es requerido' });
    const user = await UsuarioEntity.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (!user.email_change_token || !user.email_change_expires || !user.email_change_new) {
      return res.status(400).json({ message: 'No hay cambio de correo pendiente' });
    }
    if (user.email_change_token !== token) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (new Date() > new Date(user.email_change_expires)) {
      await user.update({ email_change_token: null, email_change_expires: null, email_change_new: null });
      return res.status(410).json({ message: 'Token expirado' });
    }
    const oldEmail = user.correo;
    const newEmail = user.email_change_new;
    await user.update({ correo: newEmail, email_change_token: null, email_change_expires: null, email_change_new: null, email_change_last_sent: null });

    // Intentar enviar correo de confirmación al nuevo correo
    const subject = 'Confirmación: tu correo fue actualizado';
    const text = `Hola ${user.nombre || ''},\n\n` +
      `Tu correo asociado a la cuenta ha sido actualizado correctamente.\n` +
      `Anterior: ${oldEmail}\n` +
      `Nuevo: ${newEmail}\n\n` +
      `Si no realizaste este cambio, por favor contáctanos inmediatamente o restablece tu contraseña.`;
    const html = `<p>Hola ${user.nombre || ''},</p>
      <p>Tu correo asociado a la cuenta ha sido <b>actualizado</b> correctamente.</p>
      <p><b>Anterior:</b> ${oldEmail}<br/><b>Nuevo:</b> ${newEmail}</p>
      <p>Si no realizaste este cambio, contáctanos inmediatamente o restablece tu contraseña.</p>`;
    const mail = await sendVerificationEmail({ to: newEmail, subject, text, html });

    // Notificación de seguridad al correo anterior
    const subjectOld = 'Aviso de seguridad: tu correo fue cambiado';
    const textOld = `Hola ${user.nombre || ''},\n\n` +
      `Se registró un cambio de correo en tu cuenta.\n` +
      `Anterior: ${oldEmail}\n` +
      `Nuevo: ${newEmail}\n\n` +
      `Si no realizaste este cambio, por favor restablece tu contraseña y contáctanos.`;
    const htmlOld = `<p>Hola ${user.nombre || ''},</p>
      <p>Se registró un cambio de correo en tu cuenta.</p>
      <p><b>Anterior:</b> ${oldEmail}<br/><b>Nuevo:</b> ${newEmail}</p>
      <p>Si no realizaste este cambio, restablece tu contraseña y contáctanos.</p>`;
    const mailOld = await sendVerificationEmail({ to: oldEmail, subject: subjectOld, text: textOld, html: htmlOld });

    const tokenJwt = signToken(user);
    const response = { message: 'Correo actualizado', token: tokenJwt };
    // Estado de envío al nuevo correo
    response.email_nuevo = (!mail || !mail.sent)
      ? { sent: false, reason: (mail && mail.reason) || 'No enviado' }
      : { sent: true };
    // Estado de envío de notificación al correo anterior
    response.email_anterior = (!mailOld || !mailOld.sent)
      ? { sent: false, reason: (mailOld && mailOld.reason) || 'No enviado' }
      : { sent: true };
    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al confirmar cambio de correo' });
  }
});


// Actualizar nombre (no requiere verificación por correo)
router.patch('/update-name', authenticateJWT, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: 'nombre es requerido' });
    const user = await UsuarioEntity.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    await user.update({ nombre });
    const tokenJwt = signToken(user);
    return res.status(200).json({ message: 'Nombre actualizado', token: tokenJwt });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al actualizar nombre' });
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
    await user.reload();
    const tokenJwt = signToken(user);
    return res.status(200).json({ message: 'RUT asignado', token: tokenJwt, requiresRut: false });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Error al asignar RUT' });
  }
});

module.exports = { router };