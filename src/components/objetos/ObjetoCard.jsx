import { Link } from 'react-router-dom';
import { Building2, CalendarDays, MapPin } from 'lucide-react';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { ObjetoThumb } from './ObjetoThumb.jsx';
import { ObjetoTags } from './ObjetoTags.jsx';
import { Skeleton } from '../ui/Feedback.jsx';
import { formatFecha } from '../../utils/format.js';

/**
 * Tarjeta de objeto (mismo formato para estudiante y administrador).
 * Toda la tarjeta es un enlace: seleccionable con mouse, toque o teclado.
 */
export function ObjetoCard({ objeto, to, state, extra, indice = 0 }) {
  const { modulo } = useCatalogos();
  const m = modulo(objeto.moduloId);
  const reclamado = objeto.estado === 'RECLAMADO';
  const fecha = reclamado ? objeto.fechaReclamo : objeto.fechaRegistro;
  const Contenedor = to ? Link : 'div';
  const props = to ? { to, state } : { role: 'group', 'aria-label': 'Vista previa de la tarjeta' };

  return (
    <li className="ocard" style={{ '--i': Math.min(indice, 10) }}>
      <Contenedor className="ocard__link" {...props}>
        <div className="ocard__media">
          <ObjetoThumb objeto={objeto} />
          <span className={`ocard__status ${reclamado ? 'is-claimed' : ''}`}>{reclamado ? 'Reclamado' : 'Perdido'}</span>
        </div>
        <div className="ocard__body">
          <div className="ocard__head">
            <h3 className="ocard__title">{objeto.nombre}</h3>
            <span className="ocard__folio mono">{objeto.folio}</span>
          </div>
          <p className="ocard__desc">{objeto.descripcion}</p>
          {objeto.marca && (
            <p className="ocard__brand">
              Marca: <strong>{objeto.marca}</strong>
            </p>
          )}
          <ObjetoTags objeto={objeto} max={2} />
          <dl className="ocard__meta">
            <div>
              <dt>
                <CalendarDays aria-hidden="true" />
                {reclamado ? 'Reclamado el' : 'Perdido el'}
              </dt>
              <dd>{formatFecha(fecha)}</dd>
            </div>
            <div>
              <dt>
                <MapPin aria-hidden="true" />
                Lugar
              </dt>
              <dd>{objeto.lugarPerdida}</dd>
            </div>
            <div>
              <dt>
                <Building2 aria-hidden="true" />
                Módulo
              </dt>
              <dd>{m ? m.nombre : '—'}</dd>
            </div>
          </dl>
          {extra}
        </div>
      </Contenedor>
    </li>
  );
}

export function ObjetoCardSkeleton() {
  return (
    <li className="ocard ocard--skeleton" aria-hidden="true">
      <div className="ocard__link">
        <Skeleton className="thumb thumb--card" />
        <div className="ocard__body">
          <Skeleton style={{ height: 18, width: '62%' }} />
          <Skeleton style={{ height: 12, width: '100%', marginTop: 10 }} />
          <Skeleton style={{ height: 12, width: '80%', marginTop: 6 }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <Skeleton style={{ height: 22, width: 70, borderRadius: 99 }} />
            <Skeleton style={{ height: 22, width: 56, borderRadius: 99 }} />
          </div>
          <Skeleton style={{ height: 52, width: '100%', marginTop: 14 }} />
        </div>
      </div>
    </li>
  );
}

export function ObjetoGrid({ children, loading, cantidadSkeleton = 8, label = 'Resultados' }) {
  return (
    <ul className="ogrid" aria-label={label} aria-busy={loading || undefined}>
      {loading ? Array.from({ length: cantidadSkeleton }, (_, i) => <ObjetoCardSkeleton key={i} />) : children}
    </ul>
  );
}
