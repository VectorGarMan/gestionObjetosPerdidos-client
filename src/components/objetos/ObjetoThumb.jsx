import { createElement } from 'react';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { iconoTipo } from '../../utils/iconos.js';

/**
 * Imagen del objeto. Si no hay fotografía (datos de demostración), se muestra una
 * ilustración generada a partir del tipo y color del catálogo, con tamaño uniforme.
 */
export function ObjetoThumb({ objeto, size = 'card', className = '' }) {
  const { tipo, color } = useCatalogos();
  const t = tipo(objeto.tipoObjetoId);
  const c = color(objeto.colorId);
  const alt = `${objeto.nombre}${c ? `, color ${c.nombre.toLowerCase()}` : ''}`;

  if (objeto.fotografiaUrl) {
    return (
      <div className={`thumb thumb--${size} ${className}`}>
        <img src={objeto.fotografiaUrl} alt={alt} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className={`thumb thumb--${size} thumb--illus ${className}`} style={{ '--obj-color': c?.hex ?? '#9aa4b2' }} role="img" aria-label={`Ilustración: ${alt}`}>
      <span className="thumb__halo" aria-hidden="true" />
      {createElement(iconoTipo(t), { className: 'thumb__icon', 'aria-hidden': 'true', strokeWidth: 1.4 })}
      <span className="thumb__chip" aria-hidden="true">
        <span className="thumb__dot" />
        {t?.nombre}
      </span>
    </div>
  );
}
