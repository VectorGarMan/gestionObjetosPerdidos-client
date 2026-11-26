import { useId } from 'react';
import { CircleAlert } from 'lucide-react';

/**
 * Envoltura accesible de un campo: etiqueta visible, asterisco de obligatorio,
 * ayuda y mensaje de error junto al campo (no solo con color).
 * `children` recibe las props de accesibilidad para conectarlas al control.
 */
export function Field({ label, required, hint, error, counter, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <div className="field__top">
        <label className="field__label" htmlFor={id}>
          {label}
          {required && (
            <span className="field__req" aria-hidden="true">
              {' '}*
            </span>
          )}
          {required && <span className="sr-only"> (obligatorio)</span>}
        </label>
        {counter && <span className={`field__counter ${counter.over ? 'is-over' : ''}`}>{counter.text}</span>}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, 'aria-required': required || undefined })}
      {error ? (
        <p className="field__error" id={errorId}>
          <CircleAlert aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
