import { ChevronDown } from 'lucide-react';

/** <select> nativo con estilo del sistema (mejor accesibilidad y teclado móvil). */
export function Select({ options, placeholder, value, onChange, className = '', ...rest }) {
  return (
    <div className={`select-wrap ${className}`}>
      <select className={`control control--select ${value ? 'has-value' : ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
      <ChevronDown className="control__chevron" aria-hidden="true" />
    </div>
  );
}
