import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, CloudOff } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { useSession } from '../../context/SessionContext.jsx';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { peticionesApi } from '../../services/api.js';
import { ObjetoThumb } from '../../components/objetos/ObjetoThumb.jsx';
import { Badge, EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TipoPeticionBadge, EstadoPeticionBadge } from '../../components/peticiones/PeticionBadges.jsx';
import { formatFechaHora, tiempoRelativo } from '../../utils/format.js';

/** Seguimiento de las peticiones del estudiante (complemento de PNT-04). */
export function MisSolicitudesPage() {
  const { usuario } = useSession();
  const { modulo } = useCatalogos();
  const { data, loading, error, recargar } = useAsync(() => peticionesApi.listar({ matricula: usuario.matricula }), [usuario.matricula]);

  const pendientes = data?.filter((p) => p.estado === 'PENDIENTE').length ?? 0;

  return (
    <div className="page-enter">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Seguimiento</p>
          <h1 className="page-head__title">Mis solicitudes</h1>
          <p className="page-head__sub">Consulta el estado de tus reclamos y reportes. Cuando una petición esté pendiente, acude al módulo indicado con tu credencial.</p>
        </div>
        {data && data.length > 0 && (
          <Badge tone={pendientes ? 'orange' : 'success'}>
            {pendientes ? `${pendientes} pendiente${pendientes === 1 ? '' : 's'}` : 'Todo al día'}
          </Badge>
        )}
      </header>

      {loading ? (
        <ul className="plist" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="prow prow--static">
              <Skeleton style={{ width: 56, height: 56, borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 16, width: '40%' }} />
                <Skeleton style={{ height: 12, width: '65%', marginTop: 8 }} />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <EmptyState icon={CloudOff} tone="danger" title="No pudimos cargar tus solicitudes." action={<Button variant="secondary" onClick={() => recargar()}>Reintentar</Button>} />
      ) : data.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aún no tienes solicitudes" action={<Button to="/estudiante?estado=PERDIDO">Buscar objetos perdidos</Button>}>
          Cuando reclames un objeto o reportes un reclamo de error, aparecerá aquí con su estado.
        </EmptyState>
      ) : (
        <ul className="plist">
          {data.map((p, i) => {
            const m = modulo(p.objeto?.moduloId);
            return (
              <li key={p.id} style={{ '--i': i }}>
                <Link to={`/estudiante/objetos/${p.objetoId}`} className="prow">
                  {p.objeto && <ObjetoThumb objeto={p.objeto} size="small" />}
                  <div className="prow__main">
                    <div className="prow__line">
                      <span className="prow__title">{p.objeto?.nombre ?? 'Objeto eliminado'}</span>
                      <TipoPeticionBadge tipo={p.tipo} />
                    </div>
                    <p className="prow__meta">
                      <span className="mono">{p.folio}</span> · Enviada {tiempoRelativo(p.fechaCreacion)} · {m?.nombre}
                    </p>
                  </div>
                  <div className="prow__side">
                    <EstadoPeticionBadge peticion={p} />
                    <span className="prow__date">{p.estado === 'LIBERADA' ? formatFechaHora(p.fechaLiberacion) : formatFechaHora(p.fechaCreacion)}</span>
                  </div>
                  <ArrowUpRight className="prow__go" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
