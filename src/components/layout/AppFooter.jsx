import { brand } from '../../utils/brand.js';
import { MODO_DEMO } from '../../services/api.js';

const ANIO = new Date().getFullYear();

/** Pie con Aviso de Privacidad y Términos (se abren en pestaña nueva, según F-01). */
export function AppFooter({ claro = false }) {
  return (
    <footer className={`appfooter ${claro ? 'appfooter--light' : ''}`}>
      <p>
        © {ANIO} {brand.universidad}
        {MODO_DEMO && <span className="appfooter__demo"> · Prototipo con datos de demostración</span>}
      </p>
      <nav aria-label="Información legal" className="appfooter__links">
        <a href="/aviso-de-privacidad" target="_blank" rel="noopener">
          Aviso de Privacidad
        </a>
        <a href="/terminos-y-condiciones" target="_blank" rel="noopener">
          Términos y Condiciones
        </a>
      </nav>
    </footer>
  );
}
