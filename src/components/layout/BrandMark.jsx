import { useState } from 'react';
import { brand } from '../../utils/brand.js';

/**
 * Logotipo oficial de UNIVA (desde univa.mx) + nombre del sistema.
 * Si la imagen no carga, se muestra el nombre institucional en texto: nunca un logo inventado.
 */
export function BrandMark({ tono = 'color', compacto = false }) {
  const [fallo, setFallo] = useState(false);
  const src = tono === 'blanco' ? brand.logoBlanco : brand.logoColor;

  return (
    <span className={`brandmark brandmark--${tono} ${compacto ? 'is-compact' : ''}`}>
      {fallo ? (
        <span className="brandmark__text">
          <strong>{brand.siglas}</strong>
          <small>{brand.universidad}</small>
        </span>
      ) : (
        <img className="brandmark__logo" src={src} alt={`${brand.siglas} · ${brand.universidad}`} onError={() => setFallo(true)} draggable="false" />
      )}
      {!compacto && (
        <>
          <span className="brandmark__divider" aria-hidden="true" />
          <span className="brandmark__system">{brand.sistema}</span>
        </>
      )}
    </span>
  );
}
