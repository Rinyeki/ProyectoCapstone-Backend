// Utilidades para RUT chileno: normalización, formato y dígito verificador

function normalizeRut(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.replace(/\./g, '').replace(/\s+/g, '').toUpperCase();
  // Asegura guión; si no existe, intenta separar último carácter como DV
  if (!cleaned.includes('-') && cleaned.length >= 2) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return `${body}-${dv}`;
  }
  return cleaned;
}

function isValidRutFormat(rut) {
  // Formato: solo dígitos, guión, DV (0-9 o K)
  return /^\d+-[0-9K]$/.test(rut);
}

function computeDv(numStr) {
  // Algoritmo módulo 11
  let sum = 0;
  let factor = 2;
  for (let i = numStr.length - 1; i >= 0; i--) {
    sum += parseInt(numStr[i], 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const mod = 11 - (sum % 11);
  if (mod === 11) return '0';
  if (mod === 10) return 'K';
  return String(mod);
}

function isValidRut(rut) {
  const normalized = normalizeRut(rut);
  if (!isValidRutFormat(normalized)) return false;
  const [body, dv] = normalized.split('-');
  const expected = computeDv(body);
  return dv === expected;
}

module.exports = { normalizeRut, isValidRutFormat, isValidRut, computeDv };