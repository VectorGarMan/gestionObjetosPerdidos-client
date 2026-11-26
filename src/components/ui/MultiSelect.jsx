import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Selección múltiple en un popover (filtros "Otras etiquetas").
 * Teclado: Enter/Espacio abre, flechas navegan, Espacio marca, Escape cierra.
 */
export function MultiSelect({ label, placeholder = 'Todas', options, value = [], onChange, id: idExterno, className = '', ...aria }) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const raiz = useRef(null);
  const lista = useRef(null);
  const idInterno = useId();
  const id = idExterno ?? idInterno;
  const listId = `${id}-list`;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !raiz.current?.contains(e.target) && setAbierto(false);
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) lista.current?.focus({ preventScroll: true });
  }, [abierto]);

  const alternar = (opId) => {
    onChange(value.includes(opId) ? value.filter((v) => v !== opId) : [...value, opId]);
  };

  const onKeyDownLista = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (options[activo]) alternar(options[activo].id);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      setAbierto(false);
      raiz.current?.querySelector('button')?.focus();
    }
  };

  const seleccion = options.filter((o) => value.includes(o.id));
  const resumen = seleccion.length === 0 ? placeholder : seleccion.length <= 2 ? seleccion.map((s) => s.nombre).join(', ') : `${seleccion.length} seleccionadas`;

  return (
    <div className={`multiselect ${abierto ? 'is-open' : ''} ${className}`} ref={raiz}>
      <button
        type="button"
        id={id}
        className={`control control--select multiselect__trigger ${seleccion.length ? 'has-value' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listId}
        onClick={() => setAbierto((v) => !v)}
        {...aria}
      >
        <span className="multiselect__summary">{resumen}</span>
        {seleccion.length > 0 && <span className="multiselect__count">{seleccion.length}</span>}
        <ChevronDown className="control__chevron" aria-hidden="true" />
      </button>

      <div className="popover multiselect__pop" data-open={abierto || undefined}>
        <ul
          ref={lista}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={abierto ? `${id}-opt-${activo}` : undefined}
          onKeyDown={onKeyDownLista}
          className="multiselect__list"
        >
          {options.map((o, i) => {
            const marcado = value.includes(o.id);
            return (
              <li
                key={o.id}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={marcado}
                className={`multiselect__opt ${i === activo ? 'is-active' : ''}`}
                onPointerEnter={() => setActivo(i)}
                onClick={() => alternar(o.id)}
              >
                <span className={`checkbox ${marcado ? 'is-checked' : ''}`} aria-hidden="true">
                  <Check />
                </span>
                {o.nombre}
              </li>
            );
          })}
        </ul>
        {value.length > 0 && (
          <div className="multiselect__foot">
            <button type="button" className="link-btn" onClick={() => onChange([])}>
              Limpiar selección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
