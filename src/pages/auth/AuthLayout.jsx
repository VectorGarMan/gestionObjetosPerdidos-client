import { Building2, Hand, ScanSearch } from 'lucide-react';
import { BrandMark } from '../../components/layout/BrandMark.jsx';
import { AppFooter } from '../../components/layout/AppFooter.jsx';

const pasos = [
  { icon: ScanSearch, titulo: 'Busca', texto: 'Filtra por tipo, color y etiquetas los objetos encontrados en el campus.' },
  { icon: Hand, titulo: 'Reclama', texto: 'Reconoce tu objeto por su imagen y envía una petición en segundos.' },
  { icon: Building2, titulo: 'Recoge', texto: 'Acude al módulo de resguardo indicado para recibirlo.' },
];

/** Estructura de las pantallas de acceso: panel institucional + formulario. */
export function AuthLayout({ children }) {
  return (
    <div className="auth">
      <section className="auth__hero" aria-label="Acerca de la plataforma">
        <div className="auth__hero-inner">
          <div className="auth__logo-plate">
            <BrandMark compacto />
          </div>

          <div className="auth__pitch">
            <p className="auth__eyebrow">Objetos Perdidos y Encontrados</p>
            <h1 className="auth__headline">
              Lo que se pierde en el campus, <span>vuelve a casa.</span>
            </h1>
            <p className="auth__lede">El registro central de los objetos que resguardan los módulos de la universidad, disponible desde tu celular o computadora.</p>
          </div>

          <ol className="auth__steps">
            {pasos.map(({ icon: Icon, titulo, texto }, i) => (
              <li key={titulo} style={{ '--i': i }}>
                <span className="auth__step-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <p className="auth__step-title">
                    <span className="mono">0{i + 1}</span> {titulo}
                  </p>
                  <p className="auth__step-text">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="auth__pattern" aria-hidden="true" />
      </section>

      <section className="auth__panel">
        <div className="auth__mobile-brand">
          <BrandMark />
        </div>
        <div className="auth__card page-enter">{children}</div>
        <AppFooter />
      </section>
    </div>
  );
}
