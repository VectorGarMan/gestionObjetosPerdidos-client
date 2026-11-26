import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

/**
 * Botón del sistema.
 * variant: primary | secondary | ghost | danger | danger-soft | success | accent
 * size: sm | md | lg
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, block = false, to, className = '', children, disabled, ...rest },
  ref,
) {
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', loading && 'is-loading', className]
    .filter(Boolean)
    .join(' ');

  const contenido = (
    <>
      {loading ? <LoaderCircle className="btn__spin" aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
      {children && <span className="btn__label">{children}</span>}
      {IconRight && !loading && <IconRight aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {contenido}
      </Link>
    );
  }

  return (
    <button ref={ref} type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {contenido}
    </button>
  );
});

export function IconButton({ label, icon: Icon, className = '', ...rest }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon aria-hidden="true" />
    </button>
  );
}
