import { useRef } from 'react';

/**
 * Selector excluyente accesible (role="radiogroup").
 * Admite `value` vacío: ninguna opción preseleccionada (requisito de PNT-03).
 */
export function Segmented({ label, options, value, onChange, className = '' }) {
  const refs = useRef([]);
  const indice = options.findIndex((o) => o.value === value);

  function onKeyDown(e, i) {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const sig = (i + dir + options.length) % options.length;
    refs.current[sig]?.focus();
    onChange(options[sig].value);
  }

  return (
    <div
      className={`segmented ${indice < 0 ? 'is-empty' : ''} ${className}`}
      role="radiogroup"
      aria-label={label}
      style={{ '--seg-count': options.length, '--seg-index': Math.max(indice, 0) }}
    >
      <span className="segmented__thumb" aria-hidden="true" />
      {options.map((o, i) => {
        const activo = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo || (indice < 0 && i === 0) ? 0 : -1}
            className={`segmented__opt ${activo ? 'is-active' : ''}`}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {Icon && <Icon aria-hidden="true" />}
            {o.label}
            {o.count !== undefined && <span className="segmented__count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
