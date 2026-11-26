import { useCallback } from 'react';
import { CircleCheck, CloudOff, Info, PackageSearch, SearchX, TriangleAlert } from 'lucide-react';
import { FilterBar } from '../../components/objetos/FilterBar.jsx';
import { ObjetoCard, ObjetoGrid } from '../../components/objetos/ObjetoCard.jsx';
import { Segmented } from '../../components/ui/Segmented.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { useFiltros } from '../../hooks/useFiltros.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useSession } from '../../context/SessionContext.jsx';
import { objetosApi } from '../../services/api.js';
import { useCambios } from '../../utils/events.js';

const ESTADOS = [
  { value: 'PERDIDO', label: 'Perdidos', icon: PackageSearch },
  { value: 'RECLAMADO', label: 'Reclamados', icon: CircleCheck },
];

/** PNT-03 · Pantalla principal del estudiante. */
export function ExplorarPage() {
  const { usuario } = useSession();
  const { filtros, set, limpiarEtiquetas, activos, search } = useFiltros();
  const hayEstado = Boolean(filtros.estado);

  const { data, error, loading, recargar } = useAsync(
    () => objetosApi.listar(filtros),
    [filtros.estado, filtros.tipoObjetoId, filtros.colorId, filtros.otrasEtiquetaIds.join(','), filtros.q],
    { enabled: hayEstado },
  );
  useCambios(useCallback(() => hayEstado && recargar({ silencioso: true }), [hayEstado, recargar]));

  const nombre = usuario?.nombre.split(' ')[0];
  const perdidos = filtros.estado === 'PERDIDO';

  return (
    <div className="page-enter">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Hola, {nombre}</p>
          <h1 className="page-head__title">¿Qué estás buscando?</h1>
          <p className="page-head__sub">Elige si buscas un objeto perdido o uno ya reclamado, y acota con las etiquetas que recuerdes.</p>
        </div>
      </header>

      <FilterBar filtros={filtros} set={set} limpiar={limpiarEtiquetas} activos={activos}>
        <Segmented label="Estado del objeto" options={ESTADOS} value={filtros.estado} onChange={(v) => set({ estado: v })} />
        <p className={`filterbar__hint ${hayEstado ? '' : 'is-required'}`}>
          {hayEstado ? (
            perdidos ? (
              'Objetos resguardados en los módulos que puedes reclamar.'
            ) : (
              'Objetos ya entregados. Si alguno es tuyo y no lo recogiste, repórtalo.'
            )
          ) : (
            <>
              <TriangleAlert aria-hidden="true" /> Se debe elegir uno para ver resultados.
            </>
          )}
        </p>
      </FilterBar>

      {!hayEstado ? (
        <EmptyState
          icon={Info}
          title="Selecciona «Perdidos» o «Reclamados» para ver los objetos."
          tone="warning"
          action={
            <span className="empty__choices">
              <Button variant="primary" icon={PackageSearch} onClick={() => set({ estado: 'PERDIDO' })}>
                Ver perdidos
              </Button>
              <Button variant="secondary" icon={CircleCheck} onClick={() => set({ estado: 'RECLAMADO' })}>
                Ver reclamados
              </Button>
            </span>
          }
        >
          Los objetos perdidos son los que puedes reclamar; los reclamados te permiten reportar si alguien se llevó algo tuyo por error.
        </EmptyState>
      ) : error ? (
        <EmptyState icon={CloudOff} tone="danger" title="No pudimos cargar los objetos. Inténtalo de nuevo en unos momentos." action={<Button variant="secondary" onClick={() => recargar()}>Reintentar</Button>} />
      ) : !loading && data?.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No hay objetos que coincidan con los filtros seleccionados."
          action={activos > 0 && <Button variant="secondary" onClick={limpiarEtiquetas}>Limpiar filtros</Button>}
        >
          Prueba con menos etiquetas.
        </EmptyState>
      ) : (
        <>
          <p className="results-line" aria-live="polite">
            {loading ? (
              'Buscando…'
            ) : (
              <>
                <strong>{data.length}</strong> {data.length === 1 ? 'objeto' : 'objetos'} {perdidos ? (data.length === 1 ? 'perdido' : 'perdidos') : data.length === 1 ? 'reclamado' : 'reclamados'}
                <span className="muted"> · del más reciente al más antiguo</span>
              </>
            )}
          </p>
          <ObjetoGrid loading={loading} label={perdidos ? 'Objetos perdidos' : 'Objetos reclamados'}>
            {data?.map((o, i) => (
              <ObjetoCard key={o.id} objeto={o} indice={i} to={`/estudiante/objetos/${o.id}`} state={{ from: search }} />
            ))}
          </ObjetoGrid>
        </>
      )}
    </div>
  );
}
