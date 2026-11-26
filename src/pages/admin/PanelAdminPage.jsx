import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CircleCheck, CloudOff, Inbox, PackagePlus, PackageSearch, SearchX } from 'lucide-react';
import { FilterBar } from '../../components/objetos/FilterBar.jsx';
import { ObjetoCard, ObjetoGrid } from '../../components/objetos/ObjetoCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { useFiltros } from '../../hooks/useFiltros.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { objetosApi, peticionesApi } from '../../services/api.js';
import { useCambios } from '../../utils/events.js';
import { hoyISO, parseFecha } from '../../utils/format.js';

function Kpi({ icon: Icon, label, value, hint, to, tone = 'navy', loading }) {
  const contenido = (
    <>
      <span className={`kpi__icon kpi__icon--${tone}`} aria-hidden="true">
        <Icon />
      </span>
      <span className="kpi__label">{label}</span>
      <span className="kpi__value">{loading ? <Skeleton style={{ height: 28, width: 48 }} /> : value}</span>
      {hint && <span className="kpi__hint">{hint}</span>}
      {to && <ArrowRight className="kpi__go" aria-hidden="true" />}
    </>
  );
  return to ? (
    <Link to={to} className="kpi kpi--link">
      {contenido}
    </Link>
  ) : (
    <div className="kpi">{contenido}</div>
  );
}

/** PNT-05 · Pantalla principal del administrador: todos los objetos perdidos desde el inicio. */
export function PanelAdminPage() {
  const { modulos } = useCatalogos();
  const { filtros, set, limpiarEtiquetas, activos, search } = useFiltros();
  const moduloId = new URLSearchParams(search).get('modulo') ?? '';

  const lista = useAsync(
    () => objetosApi.listar({ ...filtros, estado: 'PERDIDO', moduloId }),
    [filtros.tipoObjetoId, filtros.colorId, filtros.otrasEtiquetaIds.join(','), filtros.q, moduloId],
  );
  const resumen = useAsync(() => Promise.all([objetosApi.listar({}), peticionesApi.listar()]), []);

  useCambios(
    useCallback(() => {
      lista.recargar({ silencioso: true });
      resumen.recargar({ silencioso: true });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lista.recargar, resumen.recargar]),
  );

  const stats = useMemo(() => {
    if (!resumen.data) return null;
    const [objetos, peticiones] = resumen.data;
    const hoy = parseFecha(hoyISO());
    const haceSiete = new Date(hoy.getTime() - 6 * 864e5);
    const pendientesPorObjeto = new Map();
    peticiones.filter((p) => p.estado === 'PENDIENTE').forEach((p) => pendientesPorObjeto.set(p.objetoId, (pendientesPorObjeto.get(p.objetoId) ?? 0) + 1));
    return {
      enResguardo: objetos.filter((o) => o.estado === 'PERDIDO').length,
      pendientes: peticiones.filter((p) => p.estado === 'PENDIENTE').length,
      semana: objetos.filter((o) => parseFecha(o.fechaRegistro) >= haceSiete).length,
      entregadosMes: objetos.filter((o) => {
        const f = parseFecha(o.fechaReclamo);
        return f && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
      }).length,
      pendientesPorObjeto,
    };
  }, [resumen.data]);

  const totalSinFiltros = stats?.enResguardo;

  return (
    <div className="page-enter">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Panel administrativo</p>
          <h1 className="page-head__title">Objetos perdidos</h1>
          <p className="page-head__sub">Todos los objetos en resguardo. Selecciona uno para revisar cómo se publica, editarlo o eliminarlo.</p>
        </div>
        <div className="page-head__actions">
          <Button to="/admin/objetos/nuevo" icon={PackagePlus}>
            Dar de alta objeto
          </Button>
        </div>
      </header>

      <section className="kpis" aria-label="Resumen">
        <Kpi icon={PackageSearch} label="En resguardo" value={stats?.enResguardo} hint="Objetos perdidos publicados" loading={!stats} />
        <Kpi icon={Inbox} label="Peticiones pendientes" value={stats?.pendientes} hint="Por atender" to="/admin/peticiones" tone="orange" loading={!stats} />
        <Kpi icon={CalendarDays} label="Registrados" value={stats?.semana} hint="Últimos 7 días" loading={!stats} />
        <Kpi icon={CircleCheck} label="Entregados" value={stats?.entregadosMes} hint="Este mes" to="/admin/historial" tone="green" loading={!stats} />
      </section>

      <FilterBar filtros={filtros} set={set} limpiar={() => limpiarEtiquetas({ modulo: '' })} activos={activos + (moduloId ? 1 : 0)}>
        <span className="filterbar__lead-label">Módulo</span>
        <div className="chipgroup" role="radiogroup" aria-label="Filtrar por módulo">
          {[{ id: '', nombre: 'Todos' }, ...modulos].map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={String(m.id) === moduloId} className="chipopt" onClick={() => set({ modulo: m.id })}>
              {m.nombre}
            </button>
          ))}
        </div>
      </FilterBar>

      {lista.error ? (
        <EmptyState icon={CloudOff} tone="danger" title="No pudimos cargar los objetos. Inténtalo de nuevo en unos momentos." action={<Button variant="secondary" onClick={() => lista.recargar()}>Reintentar</Button>} />
      ) : !lista.loading && lista.data?.length === 0 ? (
        totalSinFiltros === 0 ? (
          <EmptyState icon={PackageSearch} title="Aún no hay objetos perdidos registrados." action={<Button to="/admin/objetos/nuevo" icon={PackagePlus}>Dar de alta el primero</Button>}>
            Cuando registres un objeto encontrado, aparecerá aquí y en la consulta de los estudiantes.
          </EmptyState>
        ) : (
          <EmptyState icon={SearchX} title="No hay objetos que coincidan con los filtros seleccionados." action={<Button variant="secondary" onClick={() => limpiarEtiquetas({ modulo: '' })}>Limpiar filtros</Button>}>
            Prueba con menos etiquetas.
          </EmptyState>
        )
      ) : (
        <>
          <p className="results-line" aria-live="polite">
            {lista.loading ? (
              'Cargando…'
            ) : (
              <>
                <strong>{lista.data.length}</strong> {lista.data.length === 1 ? 'objeto' : 'objetos'}
                <span className="muted"> · del registro más reciente al más antiguo</span>
              </>
            )}
          </p>
          <ObjetoGrid loading={lista.loading} label="Objetos perdidos">
            {lista.data?.map((o, i) => {
              const n = stats?.pendientesPorObjeto.get(o.id);
              return (
                <ObjetoCard
                  key={o.id}
                  objeto={o}
                  indice={i}
                  to={`/admin/objetos/${o.id}`}
                  state={{ from: search }}
                  extra={
                    n ? (
                      <span className="ocard__alert">
                        <Inbox aria-hidden="true" />
                        {n} {n === 1 ? 'petición pendiente' : 'peticiones pendientes'}
                      </span>
                    ) : null
                  }
                />
              );
            })}
          </ObjetoGrid>
        </>
      )}
    </div>
  );
}
