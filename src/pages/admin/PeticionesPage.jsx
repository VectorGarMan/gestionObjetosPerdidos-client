import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, CloudOff, Inbox, Search, SearchX } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { Segmented } from '../../components/ui/Segmented.jsx';
import { ObjetoThumb } from '../../components/objetos/ObjetoThumb.jsx';
import { TipoPeticionBadge, EstadoPeticionBadge } from '../../components/peticiones/PeticionBadges.jsx';
import { PeticionDetalle } from '../../components/peticiones/PeticionDetalle.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { peticionesApi } from '../../services/api.js';
import { useCambios } from '../../utils/events.js';
import { tiempoRelativo } from '../../utils/format.js';
import { validarMatricula } from '../../utils/validators.js';

/** PNT-08 · Peticiones de estudiantes: búsqueda por matrícula, detalle y liberación (F-05). */
export function PeticionesPage() {
  const [params, setParams] = useSearchParams();
  const matricula = params.get('matricula') ?? '';
  const vista = params.get('vista') ?? 'PENDIENTE';
  const seleccionId = Number(params.get('id')) || null;

  const [texto, setTexto] = useState(matricula);
  const [error, setError] = useState('');

  const { data, loading, error: errorCarga, recargar, setData } = useAsync(() => peticionesApi.listar({ matricula }), [matricula]);
  useCambios(useCallback(() => recargar({ silencioso: true }), [recargar]));

  const actualizarParams = (cambios) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        Object.entries(cambios).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
        return n;
      },
      { replace: true },
    );

  const buscar = (e) => {
    e.preventDefault();
    const v = texto.trim();
    const msg = validarMatricula(v);
    setError(msg);
    if (msg) return;
    actualizarParams({ matricula: v, vista: v ? 'TODAS' : vista, id: '' });
  };

  const limpiar = () => {
    setTexto('');
    setError('');
    actualizarParams({ matricula: '', id: '' });
  };

  const conteos = useMemo(() => {
    const c = { PENDIENTE: 0, LIBERADA: 0, TODAS: data?.length ?? 0 };
    data?.forEach((p) => c[p.estado]++);
    return c;
  }, [data]);

  const visibles = useMemo(() => (data ?? []).filter((p) => vista === 'TODAS' || p.estado === vista), [data, vista]);
  const seleccion = data?.find((p) => p.id === seleccionId) ?? null;

  const onCambio = (actualizada) => {
    if (actualizada) setData(data.map((p) => (p.id === actualizada.id ? actualizada : p)));
    recargar({ silencioso: true });
  };

  return (
    <div className="page-enter">
      <header className="page-head">
        <div>
          <p className="page-head__eyebrow">Atención a estudiantes</p>
          <h1 className="page-head__title">Peticiones de estudiantes</h1>
          <p className="page-head__sub">Busca por matrícula, revisa el detalle y libera la petición al entregar el objeto o al resolver un reclamo de error.</p>
        </div>
      </header>

      <section className="toolbar">
        <form className="toolbar__search" onSubmit={buscar} noValidate role="search">
          <Field label="Buscar por matrícula" error={error} hint="Solo letras y números, sin espacios. Déjalo vacío para ver todas.">
            {(a11y) => (
              <div className="input-icon">
                <Search aria-hidden="true" />
                <input
                  {...a11y}
                  className="control"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={15}
                  placeholder="Ej. 23015847"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    if (error) setError(validarMatricula(e.target.value));
                  }}
                  onBlur={() => setError(validarMatricula(texto))}
                />
              </div>
            )}
          </Field>
          <div className="toolbar__btns">
            <Button type="submit">Buscar</Button>
            {matricula && (
              <Button variant="ghost" onClick={limpiar}>
                Mostrar todas
              </Button>
            )}
          </div>
        </form>
        <Segmented
          label="Filtrar por estado"
          value={vista}
          onChange={(v) => actualizarParams({ vista: v })}
          options={[
            { value: 'PENDIENTE', label: 'Pendientes', count: conteos.PENDIENTE },
            { value: 'LIBERADA', label: 'Liberadas', count: conteos.LIBERADA },
            { value: 'TODAS', label: 'Todas', count: conteos.TODAS },
          ]}
        />
      </section>

      {matricula && !loading && (
        <p className="results-line">
          Peticiones de la matrícula <strong className="mono">{matricula}</strong>
        </p>
      )}

      {loading ? (
        <ul className="plist" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="prow prow--static">
              <Skeleton style={{ width: 56, height: 56, borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 16, width: '35%' }} />
                <Skeleton style={{ height: 12, width: '60%', marginTop: 8 }} />
              </div>
            </li>
          ))}
        </ul>
      ) : errorCarga ? (
        <EmptyState icon={CloudOff} tone="danger" title="No pudimos cargar las peticiones." action={<Button variant="secondary" onClick={() => recargar()}>Reintentar</Button>}>
          Inténtalo de nuevo en unos momentos.
        </EmptyState>
      ) : matricula && data.length === 0 ? (
        <EmptyState icon={SearchX} title={`No se encontraron peticiones para la matrícula ${matricula}.`} action={<Button variant="secondary" onClick={limpiar}>Mostrar todas</Button>} />
      ) : visibles.length === 0 ? (
        <EmptyState icon={Inbox} title={vista === 'PENDIENTE' ? 'No hay peticiones pendientes' : 'No hay peticiones en esta vista'}>
          {vista === 'PENDIENTE' ? 'Todo está al día. Las nuevas peticiones de los estudiantes aparecerán aquí.' : 'Prueba con otra pestaña.'}
        </EmptyState>
      ) : (
        <ul className="plist">
          {visibles.map((p, i) => (
            <li key={p.id} style={{ '--i': Math.min(i, 10) }}>
              <button type="button" className={`prow ${p.id === seleccionId ? 'is-selected' : ''} ${p.estado === 'LIBERADA' ? 'is-done' : ''}`} onClick={() => actualizarParams({ id: String(p.id) })} aria-haspopup="dialog">
                {p.objeto ? <ObjetoThumb objeto={p.objeto} size="small" /> : <span className="thumb thumb--small" />}
                <div className="prow__main">
                  <div className="prow__line">
                    <TipoPeticionBadge tipo={p.tipo} />
                    <span className="prow__title">{p.objeto?.nombre ?? 'Objeto eliminado'}</span>
                  </div>
                  <p className="prow__meta">
                    {p.solicitante?.nombre ?? 'Estudiante'} · <span className="mono">{p.matricula}</span>
                  </p>
                </div>
                <div className="prow__side">
                  <EstadoPeticionBadge peticion={p} />
                  <span className="prow__date">
                    <span className="mono">{p.folio}</span> · {tiempoRelativo(p.fechaCreacion)}
                  </span>
                </div>
                <ChevronRight className="prow__go" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="plist__hint">Al presionar una petición se abren sus detalles completos.</p>

      <PeticionDetalle peticion={seleccion} onClose={() => actualizarParams({ id: '' })} onCambio={onCambio} />
    </div>
  );
}
