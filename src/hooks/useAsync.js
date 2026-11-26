import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una función asíncrona y expone su estado.
 * - Ignora respuestas obsoletas cuando las dependencias cambian rápido (p. ej. filtros).
 * - `loading` es verdadero desde el primer render habilitado hasta la primera respuesta,
 *   así la UI nunca ve un estado intermedio sin datos y sin carga.
 */
export function useAsync(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled, ran: false });
  const turno = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const ejecutar = useCallback(
    async ({ silencioso = false } = {}) => {
      const mio = ++turno.current;
      setState((s) => ({ ...s, loading: !silencioso, error: null }));
      try {
        const data = await run();
        if (mio === turno.current) setState({ data, error: null, loading: false, ran: true });
        return data;
      } catch (error) {
        if (mio === turno.current) setState((s) => ({ ...s, error, loading: false, ran: true }));
        return undefined;
      }
    },
    [run],
  );

  useEffect(() => {
    if (!enabled) {
      turno.current++;
      setState({ data: null, error: null, loading: false, ran: false });
      return;
    }
    ejecutar();
  }, [ejecutar, enabled]);

  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);

  return {
    data: state.data,
    error: state.error,
    loading: state.loading || (enabled && !state.ran),
    recargar: ejecutar,
    setData,
  };
}
