import { CloudOff, History, SearchX } from 'lucide-react';
import { FilterBar } from '../../components/objetos/FilterBar.jsx';
import { ObjetoCard, ObjetoGrid } from '../../components/objetos/ObjetoCard.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import { useFiltros } from '../../hooks/useFiltros.js';
import { useAsync } from '../../hooks/useAsync.js';
import { objetosApi } from '../../services/api.js';

/** PNT-09 · Historial de objetos reclamados (solo lectura, del más reciente al más antiguo). */
export function HistorialPage() {
  const { filtros, set, limpiarEtiquetas, activos, search } = useFiltros();
  const { data, loading, error, recargar } = useAsync(
    () => objetosApi.listar({ ...filtros, estado: 'RECLAMADO' }),
    [filtros.tipoObjetoId, filtros.colorId, filtros.otrasEtiquetaIds.join(','), filtros.q],
  );

  return (
    <div className="page-enter">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Trazabilidad</p>
          <h1 className="page-head__title">Historial de objetos reclamados</h1>
          <p className="page-head__sub">Consulta qué objetos se entregaron, a quién y cuándo. Esta sección es de solo lectura.</p>
        </div>
      </header>

      <FilterBar filtros={filtros} set={set} limpiar={limpiarEtiquetas} activos={activos} />

      {error ? (
        <EmptyState icon={CloudOff} tone="danger" title="No pudimos cargar el historial." action={<Button variant="secondary" onClick={() => recargar()}>Reintentar</Button>} />
      ) : !loading && data.length === 0 ? (
        activos ? (
          <EmptyState icon={SearchX} title="No hay objetos que coincidan con los filtros seleccionados." action={<Button variant="secondary" onClick={() => limpiarEtiquetas()}>Limpiar filtros</Button>}>
            Prueba con menos etiquetas.
          </EmptyState>
        ) : (
          <EmptyState icon={History} title="Aún no hay objetos reclamados.">
            Cuando liberes una petición de reclamo, el objeto aparecerá aquí.
          </EmptyState>
        )
      ) : (
        <>
          <p className="results-line" aria-live="polite">
            {loading ? (
              'Cargando…'
            ) : (
              <>
                <strong>{data.length}</strong> {data.length === 1 ? 'objeto reclamado' : 'objetos reclamados'}
                <span className="muted"> · del más reciente al más antiguo</span>
              </>
            )}
          </p>
          <ObjetoGrid loading={loading} label="Objetos reclamados">
            {data?.map((o, i) => (
              <ObjetoCard key={o.id} objeto={o} indice={i} to={`/admin/historial/${o.id}`} state={{ from: search }} />
            ))}
          </ObjetoGrid>
        </>
      )}
    </div>
  );
}
