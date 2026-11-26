const fmtFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtFechaLarga = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtHora = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });

/** Interpreta 'YYYY-MM-DD' como fecha local (evita el desfase por zona horaria). */
export function parseFecha(valor) {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [y, m, d] = valor.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(valor);
}

export function hoyISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ahoraISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${hoyISO()}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatFecha(valor) {
  const d = parseFecha(valor);
  return d ? fmtFecha.format(d).replace('.', '') : '—';
}

export function formatFechaLarga(valor) {
  const d = parseFecha(valor);
  return d ? fmtFechaLarga.format(d) : '—';
}

export function formatFechaHora(valor) {
  const d = parseFecha(valor);
  return d ? `${formatFecha(valor)} · ${fmtHora.format(d)}` : '—';
}

export function tiempoRelativo(valor) {
  const d = parseFecha(valor);
  if (!d) return '';
  const diffMin = Math.round((d.getTime() - Date.now()) / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 1) return 'justo ahora';
  if (abs < 60) return rtf.format(diffMin, 'minute');
  if (abs < 60 * 24) return rtf.format(Math.round(diffMin / 60), 'hour');
  if (abs < 60 * 24 * 30) return rtf.format(Math.round(diffMin / (60 * 24)), 'day');
  return formatFecha(valor);
}

export function iniciales(nombre = '') {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function pluralizar(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Normaliza para búsquedas sin acentos ni mayúsculas. */
export function normalizar(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
