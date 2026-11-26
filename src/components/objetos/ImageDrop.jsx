import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { comprimirImagen } from '../../utils/image.js';
import { validarImagen } from '../../utils/validators.js';

/**
 * Carga de fotografía con vista previa: clic, arrastrar y soltar o teclado.
 * Valida formato (JPG/PNG) y tamaño (≤ 5 MB) antes de aceptarla.
 */
export function ImageDrop({ value, onChange, onError, a11y }) {
  const input = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const procesar = async (file) => {
    if (!file) return;
    const err = validarImagen(file);
    if (err) {
      onError(err);
      return;
    }
    setProcesando(true);
    try {
      const url = await comprimirImagen(file);
      onChange(url, file);
      onError('');
    } catch {
      onError('No pudimos leer la imagen. Intenta con otro archivo.');
    } finally {
      setProcesando(false);
      if (input.current) input.current.value = '';
    }
  };

  const abrir = () => input.current?.click();

  return (
    <div
      className={`imgdrop ${value ? 'has-image' : ''} ${arrastrando ? 'is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        procesar(e.dataTransfer.files?.[0]);
      }}
    >
      <input ref={input} type="file" accept="image/jpeg,image/png" className="sr-only" tabIndex={-1} onChange={(e) => procesar(e.target.files?.[0])} />

      {value ? (
        <>
          <img src={value} alt="Vista previa de la fotografía" className="imgdrop__preview" />
          <div className="imgdrop__bar">
            <button type="button" className="imgdrop__btn" onClick={abrir} {...a11y}>
              <RefreshCw aria-hidden="true" />
              Cambiar foto
            </button>
            <button type="button" className="imgdrop__btn imgdrop__btn--danger" onClick={() => onChange(null, null)}>
              <Trash2 aria-hidden="true" />
              Quitar
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="imgdrop__empty" onClick={abrir} {...a11y}>
          <span className="imgdrop__icon" aria-hidden="true">
            {procesando ? <LoaderCircle className="btn__spin" /> : <ImagePlus />}
          </span>
          <span className="imgdrop__title">{procesando ? 'Procesando imagen…' : 'Selecciona o arrastra una foto'}</span>
          <span className="imgdrop__hint">JPG o PNG · máximo 5 MB</span>
        </button>
      )}
    </div>
  );
}
