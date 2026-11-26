import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { catalogosApi } from '../services/api.js';

const CatalogosContext = createContext(null);

const vacio = { tiposObjeto: [], colores: [], etiquetas: [], modulos: [] };

/** Carga los catálogos una sola vez y expone búsquedas por id. */
export function CatalogosProvider({ children }) {
  const [data, setData] = useState(vacio);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    catalogosApi
      .todos()
      .then((c) => vivo && (setData(c), setListo(true)))
      .catch((e) => vivo && setError(e));
    return () => {
      vivo = false;
    };
  }, []);

  const value = useMemo(() => {
    const porId = (lista) => new Map(lista.map((x) => [x.id, x]));
    const mapas = {
      tipos: porId(data.tiposObjeto),
      colores: porId(data.colores),
      etiquetas: porId(data.etiquetas),
      modulos: porId(data.modulos),
    };
    return {
      ...data,
      listo,
      error,
      tipo: (id) => mapas.tipos.get(Number(id)),
      color: (id) => mapas.colores.get(Number(id)),
      etiqueta: (id) => mapas.etiquetas.get(Number(id)),
      modulo: (id) => mapas.modulos.get(Number(id)),
    };
  }, [data, listo, error]);

  return <CatalogosContext.Provider value={value}>{children}</CatalogosContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogos() {
  const ctx = useContext(CatalogosContext);
  if (!ctx) throw new Error('useCatalogos debe usarse dentro de <CatalogosProvider>');
  return ctx;
}
