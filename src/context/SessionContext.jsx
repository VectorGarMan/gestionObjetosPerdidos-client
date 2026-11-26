import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EVENTO_SESION_EXPIRADA, token } from '../services/http.js';

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
 * Con la API real, el token JWT se recibe en el paso 1 (ver api.http.js) y se borra al salir.
 */
export function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leer(KEY));
  const [pendiente, setPendienteState] = useState(() => leer(`${KEY}:pendiente`));

  const setPendiente = useCallback((u) => {
    if (u) sessionStorage.setItem(`${KEY}:pendiente`, JSON.stringify(u));
    else {
      sessionStorage.removeItem(`${KEY}:pendiente`);
      token.borrar(); // «Esta no es mi cuenta»: el token pertenece a la cuenta descartada.
    }
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
    token.borrar();
    setUsuario(null);
    setPendienteState(null);
  }, []);

  // La API respondió 401 (token vencido o inválido): se vuelve a PNT-01.
  useEffect(() => {
    const alExpirar = (e) => {
      if (!sessionStorage.getItem(KEY)) return;
      cerrarSesion();
      toast.error('Tu sesión expiró', { description: e.detail || 'Identifícate de nuevo para continuar.' });
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, [cerrarSesion]);

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
