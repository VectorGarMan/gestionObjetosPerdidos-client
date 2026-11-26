import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { Select } from '../ui/Select.jsx';
import { MultiSelect } from '../ui/MultiSelect.jsx';
import { ColorSwatch } from '../ui/Feedback.jsx';

/**
 * Barra de filtros por etiquetas (F-02): búsqueda libre, tipo, color y otras etiquetas.
 * Muestra los filtros activos como chips removibles.
 */
export function FilterBar({ filtros, set, limpiar, activos, children }) {
  const cat = useCatalogos();
  const [q, setQ] = useState(filtros.q);
  const [qUrl, setQUrl] = useState(filtros.q);
  if (filtros.q !== qUrl) {
    // La URL cambió desde fuera (chip, limpiar, navegación): se refleja en el campo.
    setQUrl(filtros.q);
    setQ(filtros.q);
  }

  // Búsqueda con espera corta para no consultar en cada tecla.
  useEffect(() => {
    if (q === filtros.q) return;
    const t = setTimeout(() => set({ q: q.trim() }), 280);
    return () => clearTimeout(t);
  }, [q, filtros.q, set]);


  const chips = [
    filtros.q && { key: 'q', label: `“${filtros.q}”`, quitar: () => (setQ(''), set({ q: '' })) },
    filtros.tipoObjetoId && { key: 'tipo', label: cat.tipo(filtros.tipoObjetoId)?.nombre, quitar: () => set({ tipoObjetoId: '' }) },
    filtros.colorId && {
      key: 'color',
      label: cat.color(filtros.colorId)?.nombre,
      swatch: cat.color(filtros.colorId),
      quitar: () => set({ colorId: '' }),
    },
    ...filtros.otrasEtiquetaIds.map((id) => ({
      key: `e${id}`,
      label: cat.etiqueta(id)?.nombre,
      quitar: () => set({ otrasEtiquetaIds: filtros.otrasEtiquetaIds.filter((x) => x !== id) }),
    })),
  ].filter(Boolean);

  return (
    <section className="filterbar" aria-label="Filtros de búsqueda">
      {children && <div className="filterbar__lead">{children}</div>}

      <div className="filterbar__grid">
        <div className="filterbar__search">
          <label htmlFor="f-q" className="filterbar__label">
            Buscar
          </label>
          <div className="input-icon">
            <Search aria-hidden="true" />
            <input
              id="f-q"
              type="search"
              className="control"
              placeholder="Nombre, marca, lugar o folio"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
        </div>
        <div>
          <label htmlFor="f-tipo" className="filterbar__label">
            Tipo de objeto
          </label>
          <Select id="f-tipo" options={cat.tiposObjeto} placeholder="Todos" value={filtros.tipoObjetoId} onChange={(v) => set({ tipoObjetoId: v })} />
        </div>
        <div>
          <label htmlFor="f-color" className="filterbar__label">
            Color
          </label>
          <Select id="f-color" options={cat.colores} placeholder="Todos" value={filtros.colorId} onChange={(v) => set({ colorId: v })} />
        </div>
        <div>
          <span className="filterbar__label" id="f-etq-label">
            Otras etiquetas
          </span>
          <MultiSelect
            id="f-etq"
            label="Otras etiquetas"
            aria-labelledby="f-etq-label f-etq"
            options={cat.etiquetas}
            value={filtros.otrasEtiquetaIds}
            onChange={(v) => set({ otrasEtiquetaIds: v })}
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="filterbar__chips">
          <span className="filterbar__chips-label">
            <SlidersHorizontal aria-hidden="true" />
            {activos} {activos === 1 ? 'filtro' : 'filtros'}
          </span>
          <ul>
            {chips.map((c) => (
              <li key={c.key}>
                <button type="button" className="fchip" onClick={c.quitar} aria-label={`Quitar filtro ${c.label}`}>
                  {c.swatch && <ColorSwatch color={c.swatch} size={10} />}
                  {c.label}
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="link-btn" onClick={() => (setQ(''), limpiar())}>
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  );
}
