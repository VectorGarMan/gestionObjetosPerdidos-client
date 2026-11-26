import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const SALIDA_MS = 170;

/**
 * Diálogo modal sobre <dialog> nativo: atrapa el foco, cierra con Escape,
 * devuelve el foco al disparador y anima entrada/salida con CSS.
 * variant: center (modal) | sheet (panel lateral en escritorio, inferior en móvil)
 */
export function Dialog({ open, onClose, title, description, icon, children, footer, size = 'md', variant = 'center', dismissible = true, className = '' }) {
  const ref = useRef(null);
  const tituloId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.removeAttribute('data-closing');
      el.showModal();
    } else if (!open && el.open) {
      el.setAttribute('data-closing', '');
      const t = setTimeout(() => {
        el.close();
        el.removeAttribute('data-closing');
      }, SALIDA_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog--${variant} dialog--${size} ${className}`}
      aria-labelledby={title ? tituloId : undefined}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose?.();
      }}
      onClick={(e) => {
        if (e.target === ref.current && dismissible) onClose?.();
      }}
    >
      <div className="dialog__panel">
        {(title || dismissible) && (
          <header className="dialog__header">
            {icon && <div className="dialog__icon">{icon}</div>}
            <div className="dialog__titles">
              {title && (
                <h2 className="dialog__title" id={tituloId}>
                  {title}
                </h2>
              )}
              {description && (
                <p className="dialog__desc" id={descId}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button type="button" className="icon-btn dialog__close" aria-label="Cerrar" onClick={onClose}>
                <X aria-hidden="true" />
              </button>
            )}
          </header>
        )}
        {children && <div className="dialog__body">{children}</div>}
        {footer && <footer className="dialog__footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
