import { CircleCheck, Clock, FileWarning, Hand } from 'lucide-react';
import { Badge } from '../ui/Feedback.jsx';

/** Tipo de petición: etiqueta de texto distinta para cada caso (no solo color). */
export function TipoPeticionBadge({ tipo }) {
  return tipo === 'RECLAMO_ERROR' ? (
    <Badge tone="danger" icon={FileWarning}>
      Reclamo de error
    </Badge>
  ) : (
    <Badge tone="blue" icon={Hand}>
      Reclamo
    </Badge>
  );
}

export function EstadoPeticionBadge({ peticion }) {
  if (peticion.resolucion === 'NO_PROCEDE') {
    return <Badge tone="neutral">No procede</Badge>;
  }
  if (peticion.estado === 'LIBERADA') {
    return (
      <Badge tone="success" icon={CircleCheck}>
        {peticion.tipo === 'RECLAMO' ? 'Entregado' : 'Resuelto'}
      </Badge>
    );
  }
  return (
    <Badge tone="warning" icon={Clock}>
      Pendiente
    </Badge>
  );
}
