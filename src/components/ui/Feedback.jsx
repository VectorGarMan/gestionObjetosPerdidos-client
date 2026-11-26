import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';

/** Etiqueta de estado. tone: neutral | blue | orange | success | danger | warning */
export function Badge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </span>
  );
}

const ICONOS = { info: Info, warning: TriangleAlert, danger: CircleAlert, success: CircleCheck };

/** Mensaje en línea. tone: info | warning | danger | success */
export function Alert({ tone = 'info', title, children, action, className = '' }) {
  const Icon = ICONOS[tone];
  return (
    <div className={`alert alert--${tone} ${className}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon className="alert__icon" aria-hidden="true" />
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__text">{children}</div>}
      </div>
      {action && <div className="alert__action">{action}</div>}
    </div>
  );
}

/** Estado vacío ilustrado con ícono. */
export function EmptyState({ icon: Icon, title, children, action, tone = 'neutral' }) {
  return (
    <div className={`empty empty--${tone}`} role="status">
      {Icon && (
        <div className="empty__icon" aria-hidden="true">
          <Icon />
        </div>
      )}
      <p className="empty__title">{title}</p>
      {children && <p className="empty__text">{children}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '', style }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function ColorSwatch({ color, size = 12 }) {
  if (!color) return null;
  return <span className="swatch" style={{ width: size, height: size, background: color.hex }} aria-hidden="true" />;
}
