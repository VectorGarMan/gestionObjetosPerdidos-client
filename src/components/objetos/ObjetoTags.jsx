import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { ColorSwatch } from '../ui/Feedback.jsx';

/** Etiquetas del objeto: tipo, color y otras etiquetas del catálogo. */
export function ObjetoTags({ objeto, max }) {
  const { tipo, color, etiqueta } = useCatalogos();
  const t = tipo(objeto.tipoObjetoId);
  const c = color(objeto.colorId);
  const otras = objeto.otrasEtiquetaIds.map(etiqueta).filter(Boolean);
  const visibles = max ? otras.slice(0, max) : otras;
  const ocultas = otras.length - visibles.length;

  return (
    <ul className="tags" aria-label="Etiquetas">
      {t && <li className="tag tag--strong">{t.nombre}</li>}
      {c && (
        <li className="tag tag--strong">
          <ColorSwatch color={c} size={10} />
          {c.nombre}
        </li>
      )}
      {visibles.map((e) => (
        <li key={e.id} className="tag">
          {e.nombre}
        </li>
      ))}
      {ocultas > 0 && (
        <li className="tag tag--more" aria-label={`${ocultas} etiquetas más`}>
          +{ocultas}
        </li>
      )}
    </ul>
  );
}
