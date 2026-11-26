import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filtros de objetos sincronizados con la URL (?estado=&tipo=&color=&etiquetas=&q=).
 * Así «Regresar» desde el detalle conserva los filtros y las búsquedas se pueden compartir.
 */
export function useFiltros() {
  const [params, setParams] = useSearchParams();

  const filtros = useMemo(
    () => ({
      estado: params.get('estado') ?? '',
      tipoObjetoId: params.get('tipo') ?? '',
      colorId: params.get('color') ?? '',
      otrasEtiquetaIds: (params.get('etiquetas') ?? '').split(',').filter(Boolean).map(Number),
      q: params.get('q') ?? '',
    }),
    [params],
  );

  const set = useCallback(
    (cambios) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const mapa = { estado: 'estado', tipoObjetoId: 'tipo', colorId: 'color', otrasEtiquetaIds: 'etiquetas', q: 'q' };
          Object.entries(cambios).forEach(([k, v]) => {
            const clave = mapa[k] ?? k;
            const valor = Array.isArray(v) ? v.join(',') : v;
            if (valor === '' || valor === null || valor === undefined) next.delete(clave);
            else next.set(clave, String(valor));
          });
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const limpiarEtiquetas = useCallback(
    (extra = {}) => set({ tipoObjetoId: '', colorId: '', otrasEtiquetaIds: [], q: '', ...extra }),
    [set],
  );

  const activos = (filtros.tipoObjetoId ? 1 : 0) + (filtros.colorId ? 1 : 0) + filtros.otrasEtiquetaIds.length + (filtros.q ? 1 : 0);

  return { filtros, set, limpiarEtiquetas, activos, search: params.toString() };
}
