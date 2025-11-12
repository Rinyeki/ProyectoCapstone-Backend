const jwt = require('jsonwebtoken');
const { PymeEntity } = require('../entities/pymeEntity');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(user) {
  const payload = {
    id: user.id,
    rol: user.rol,
    rut_chileno: user.rut_chileno,
    correo: user.correo,
    nombre: user.nombre,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    next();
  };
}

function authorizeSelfOrAdmin(paramName = 'id') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    const reqId = Number(req.params[paramName]);
    if (req.user.rol === 'administrador' || req.user.id === reqId) {
      return next();
    }
    return res.status(403).json({ message: 'No autorizado' });
  };
}

async function authorizePymeOwnershipOrAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (req.user.rol === 'administrador') return next();
    const id = Number(req.params.id);
    const pyme = await PymeEntity.findByPk(id);
    if (!pyme) return res.status(404).json({ message: 'Pyme no encontrada' });
    if (pyme.rut_chileno === req.user.rut_chileno) return next();
    return res.status(403).json({ message: 'No autorizado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error de autorización' });
  }
}

module.exports = {
  signToken,
  authenticateJWT,
  authorizeRole,
  authorizeSelfOrAdmin,
  authorizePymeOwnershipOrAdmin,
};