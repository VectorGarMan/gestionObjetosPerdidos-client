import { useEffect } from 'react';

/**
 * Bus mínimo para avisar a otras vistas que los datos cambiaron
 * (p. ej. el contador de peticiones pendientes en el menú).
 */
const EVENTO = 'univa-op:cambio';

export function emitirCambio(tipo = 'datos') {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: tipo }));
}

export function useCambios(callback) {
  useEffect(() => {
    const h = (e) => callback(e.detail);
    window.addEventListener(EVENTO, h);
    return () => window.removeEventListener(EVENTO, h);
  }, [callback]);
}
