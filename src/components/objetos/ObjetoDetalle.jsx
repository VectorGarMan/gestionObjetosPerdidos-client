import { Building2, CalendarDays, Clock, MapPin, Tag } from 'lucide-react';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { ObjetoThumb } from './ObjetoThumb.jsx';
import { ObjetoTags } from './ObjetoTags.jsx';
import { Badge, Skeleton } from '../ui/Feedback.jsx';
import { formatFecha, formatFechaLarga } from '../../utils/format.js';

/**
 * Vista ampliada del objeto (PNT-04, PNT-06 y detalle del historial).
 * Muestra exactamente los datos que ve el estudiante; `aside` recibe las acciones por rol.
 */
export function ObjetoDetalle({ objeto, aside, children }) {
  const { modulo } = useCatalogos();
  const m = modulo(objeto.moduloId);
  const reclamado = objeto.estado === 'RECLAMADO';

  return (
    <article className="odetail page-enter">
      <div className="odetail__media">
        <ObjetoThumb objeto={objeto} size="large" />
      </div>

      <div className="odetail__info">
        <div className="odetail__badges">
          <Badge tone={reclamado ? 'success' : 'orange'}>{reclamado ? 'Reclamado' : 'Perdido'}</Badge>
          <span className="odetail__folio mono">Folio {objeto.folio}</span>
        </div>
        <h1 className="odetail__title">{objeto.nombre}</h1>
        <p className="odetail__desc">{objeto.descripcion}</p>

        <dl className="odetail__facts">
          {objeto.marca && (
            <div>
              <dt>
                <Tag aria-hidden="true" />
                Marca
              </dt>
              <dd>{objeto.marca}</dd>
            </div>
          )}
          <div>
            <dt>
              <CalendarDays aria-hidden="true" />
              {reclamado ? 'Reclamado el' : 'Perdido el'}
            </dt>
            <dd title={formatFechaLarga(reclamado ? objeto.fechaReclamo : objeto.fechaRegistro)}>
              {formatFecha(reclamado ? objeto.fechaReclamo : objeto.fechaRegistro)}
            </dd>
          </div>
          {reclamado && (
            <div>
              <dt>
                <Clock aria-hidden="true" />
                Registrado el
              </dt>
              <dd>{formatFecha(objeto.fechaRegistro)}</dd>
            </div>
          )}
          <div>
            <dt>
              <MapPin aria-hidden="true" />
              Lugar de pérdida
            </dt>
            <dd>{objeto.lugarPerdida}</dd>
          </div>
          <div>
            <dt>
              <Building2 aria-hidden="true" />
              Módulo
            </dt>
            <dd>{m ? `${m.nombre} · ${m.ubicacion}` : '—'}</dd>
          </div>
        </dl>

        <div className="odetail__tags">
          <p className="odetail__label">Etiquetas</p>
          <ObjetoTags objeto={objeto} />
        </div>

        {children}
      </div>

      {aside && <aside className="odetail__aside">{aside}</aside>}
    </article>
  );
}

export function ObjetoDetalleSkeleton() {
  return (
    <div className="odetail" aria-busy="true" aria-label="Cargando objeto">
      <div className="odetail__media">
        <Skeleton className="thumb thumb--large" />
      </div>
      <div className="odetail__info">
        <Skeleton style={{ height: 22, width: 140, borderRadius: 99 }} />
        <Skeleton style={{ height: 34, width: '70%', marginTop: 16 }} />
        <Skeleton style={{ height: 14, width: '100%', marginTop: 16 }} />
        <Skeleton style={{ height: 14, width: '85%', marginTop: 8 }} />
        <Skeleton style={{ height: 120, width: '100%', marginTop: 24 }} />
      </div>
      <div className="odetail__aside">
        <Skeleton style={{ height: 200, width: '100%', borderRadius: 16 }} />
      </div>
    </div>
  );
}

/** Tarjeta "dónde recogerlo" — se muestra junto al botón de reclamar. */
export function ModuloCard({ moduloId, titulo = 'Dónde recogerlo' }) {
  const { modulo } = useCatalogos();
  const m = modulo(moduloId);
  if (!m) return null;
  return (
    <div className="modcard">
      <div className="modcard__icon" aria-hidden="true">
        <Building2 />
      </div>
      <div>
        <p className="modcard__eyebrow">{titulo}</p>
        <p className="modcard__name">{m.nombre}</p>
        <p className="modcard__loc">{m.ubicacion}</p>
        <p className="modcard__hours">
          <Clock aria-hidden="true" />
          {m.horario}
        </p>
      </div>
    </div>
  );
}
