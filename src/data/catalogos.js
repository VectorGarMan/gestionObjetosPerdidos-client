/**
 * Catálogos compartidos (GET /api/catalogos/{tipo}).
 * El administrador usa los mismos catálogos al dar de alta que el estudiante al filtrar.
 * `icono` es la clave del ícono de lucide que representa el tipo (ver utils/iconos.js).
 */

export const tiposObjeto = [
  { id: 1, nombre: 'Mochila', icono: 'Backpack' },
  { id: 2, nombre: 'Celular', icono: 'Smartphone' },
  { id: 3, nombre: 'Laptop o tableta', icono: 'Laptop' },
  { id: 4, nombre: 'Llaves', icono: 'KeyRound' },
  { id: 5, nombre: 'Credencial', icono: 'IdCard' },
  { id: 6, nombre: 'Audífonos', icono: 'Headphones' },
  { id: 7, nombre: 'Cartera o monedero', icono: 'Wallet' },
  { id: 8, nombre: 'Lentes', icono: 'Glasses' },
  { id: 9, nombre: 'Paraguas', icono: 'Umbrella' },
  { id: 10, nombre: 'Ropa o accesorio', icono: 'Shirt' },
  { id: 11, nombre: 'Libro o cuaderno', icono: 'BookOpen' },
  { id: 12, nombre: 'Calculadora', icono: 'Calculator' },
  { id: 13, nombre: 'Termo o botella', icono: 'Milk' },
  { id: 14, nombre: 'Reloj o pulsera', icono: 'Watch' },
  { id: 15, nombre: 'Cargador o cable', icono: 'Cable' },
  { id: 16, nombre: 'Útiles escolares', icono: 'PencilRuler' },
];

export const colores = [
  { id: 1, nombre: 'Negro', hex: '#1f2328' },
  { id: 2, nombre: 'Blanco', hex: '#f4f4f2' },
  { id: 3, nombre: 'Gris', hex: '#8c96a3' },
  { id: 4, nombre: 'Azul', hex: '#2563eb' },
  { id: 5, nombre: 'Azul marino', hex: '#1e3a6e' },
  { id: 6, nombre: 'Rojo', hex: '#d63a2f' },
  { id: 7, nombre: 'Verde', hex: '#1f9d55' },
  { id: 8, nombre: 'Amarillo', hex: '#e8b416' },
  { id: 9, nombre: 'Naranja', hex: '#f18903' },
  { id: 10, nombre: 'Rosa', hex: '#e35d9b' },
  { id: 11, nombre: 'Morado', hex: '#7c4dcc' },
  { id: 12, nombre: 'Café', hex: '#8a5a32' },
  { id: 13, nombre: 'Plateado', hex: '#c3cad4' },
  { id: 14, nombre: 'Dorado', hex: '#c9a227' },
  { id: 15, nombre: 'Multicolor', hex: 'conic-gradient(#d63a2f, #e8b416, #1f9d55, #2563eb, #7c4dcc, #d63a2f)' },
];

export const etiquetas = [
  { id: 1, nombre: 'Electrónico' },
  { id: 2, nombre: 'Con funda' },
  { id: 3, nombre: 'Con estuche' },
  { id: 4, nombre: 'Con calcomanías' },
  { id: 5, nombre: 'Con llavero' },
  { id: 6, nombre: 'Deportivo' },
  { id: 7, nombre: 'Impermeable' },
  { id: 8, nombre: 'Piel' },
  { id: 9, nombre: 'Tela' },
  { id: 10, nombre: 'Metálico' },
  { id: 11, nombre: 'Plástico' },
  { id: 12, nombre: 'Pequeño' },
  { id: 13, nombre: 'Grande' },
  { id: 14, nombre: 'Frágil' },
  { id: 15, nombre: 'Con cierre' },
];

export const modulos = [
  {
    id: 1,
    nombre: 'Módulo 1',
    ubicacion: 'Edificio A, planta baja',
    horario: 'Lun a vie · 7:00 a 21:00',
  },
  {
    id: 2,
    nombre: 'Módulo 2',
    ubicacion: 'Biblioteca, mostrador de préstamo',
    horario: 'Lun a vie · 8:00 a 20:00 · Sáb 9:00 a 14:00',
  },
  {
    id: 3,
    nombre: 'Módulo 3',
    ubicacion: 'Servicios Escolares',
    horario: 'Lun a vie · 8:00 a 18:00',
  },
];

export const catalogos = { tiposObjeto, colores, etiquetas, modulos };
