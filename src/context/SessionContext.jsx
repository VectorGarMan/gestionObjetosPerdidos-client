import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const KEY = 'univa-op:sesion';
const SessionContext = createContext(null);

function leer(clave) {
  try {
    return JSON.parse(sessionStorage.getItem(clave) || 'null');
  } catch {
    return null;
  }
}

/**
 * Sesión en dos pasos (PNT-01 → PNT-02):
 *  - `pendiente`: usuario identificado por correo, aún sin confirmar.
 *  - `usuario`: usuario que confirmó sus datos y entró a la plataforma.
 */
export function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leer(KEY));
  const [pendiente, setPendienteState] = useState(() => leer(`${KEY}:pendiente`));

  const setPendiente = useCallback((u) => {
    if (u) sessionStorage.setItem(`${KEY}:pendiente`, JSON.stringify(u));
    else sessionStorage.removeItem(`${KEY}:pendiente`);
    setPendienteState(u);
  }, []);

  const confirmar = useCallback(() => {
    const u = leer(`${KEY}:pendiente`);
    if (!u) return null;
    sessionStorage.setItem(KEY, JSON.stringify(u));
    sessionStorage.removeItem(`${KEY}:pendiente`);
    setUsuario(u);
    setPendienteState(null);
    return u;
  }, []);

  const cerrarSesion = useCallback(() => {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(`${KEY}:pendiente`);
    setUsuario(null);
    setPendienteState(null);
  }, []);

  const value = useMemo(
    () => ({ usuario, pendiente, setPendiente, confirmar, cerrarSesion }),
    [usuario, pendiente, setPendiente, confirmar, cerrarSesion],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}

export const rutaInicio = (rol) => (rol === 'ADMINISTRADOR' ? '/admin' : '/estudiante');
