import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CircleCheck, Inbox, PackagePlus, PackageX, PencilLine, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { ObjetoDetalle, ObjetoDetalleSkeleton } from '../../components/objetos/ObjetoDetalle.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert, EmptyState } from '../../components/ui/Feedback.jsx';
import { useConfirm } from '../../components/ui/ConfirmProvider.jsx';
import { TipoPeticionBadge, EstadoPeticionBadge } from '../../components/peticiones/PeticionBadges.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { objetosApi } from '../../services/api.js';
import { emitirCambio } from '../../utils/events.js';
import { formatFecha, formatFechaHora } from '../../utils/format.js';

/** Línea de tiempo del objeto: registro, peticiones y entrega (trazabilidad). */
function Trazabilidad({ objeto }) {
  const eventos = [
    { fecha: objeto.fechaRegistro, icon: PackagePlus, texto: 'Objeto registrado y publicado', tono: 'navy' },
    ...objeto.peticiones.flatMap((p) => [
      {
        fecha: p.fechaCreacion,
        icon: Inbox,
        texto: `${p.tipo === 'RECLAMO' ? 'Reclamo' : 'Reclamo de error'} de ${p.solicitante?.nombre ?? p.matricula}`,
        tono: p.tipo === 'RECLAMO' ? 'blue' : 'danger',
      },
      p.estado === 'LIBERADA' && {
        fecha: p.fechaLiberacion,
        icon: CircleCheck,
        texto: `${p.tipo === 'RECLAMO' ? 'Entregado' : 'Caso resuelto'} · ${p.liberadaPor}`,
        tono: 'green',
      },
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="panel">
      <p className="panel__title">Trazabilidad</p>
      <ol className="timeline">
        {eventos.map((e, i) => (
          <li key={i} className={`timeline__item timeline__item--${e.tono}`}>
            <span className="timeline__dot" aria-hidden="true">
              <e.icon />
            </span>
            <p className="timeline__text">{e.texto}</p>
            <p className="timeline__date">{e.fecha.includes('T') ? formatFechaHora(e.fecha) : formatFecha(e.fecha)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** PNT-06 (editar / eliminar) y detalle de solo lectura del historial (PNT-09). */
export function DetalleAdminPage({ soloLectura = false }) {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const base = soloLectura ? '/admin/historial' : '/admin';
  const volverA = `${base}${state?.from ? `?${state.from}` : ''}`;

  const { data: o, loading, error } = useAsync(() => objetosApi.obtener(id), [id]);

  const regresar = (
    <Link to={volverA} className="back-link">
      <ChevronLeft aria-hidden="true" />
      {soloLectura ? 'Regresar al historial' : 'Regresar a objetos perdidos'}
    </Link>
  );

  if (loading)
    return (
      <>
        {regresar}
        <ObjetoDetalleSkeleton />
      </>
    );

  if (error || !o)
    return (
      <>
        {regresar}
        <EmptyState icon={PackageX} tone="danger" title="Este objeto ya no existe" action={<Button to={base} variant="secondary">Volver</Button>}>
          {error?.message}
        </EmptyState>
      </>
    );

  const pendientes = o.peticiones.filter((p) => p.estado === 'PENDIENTE');

  const eliminar = async () => {
    const ok = await confirm({
      title: 'Eliminar objeto',
      message: `Vas a eliminar «${o.nombre}». Esta acción no se puede deshacer. ¿Deseas continuar?`,
      details: pendientes.length > 0 && (
        <Alert tone="warning" className="confirm__error">
          Tiene {pendientes.length} {pendientes.length === 1 ? 'petición pendiente que también se eliminará' : 'peticiones pendientes que también se eliminarán'}.
        </Alert>
      ),
      confirmLabel: 'Eliminar definitivamente',
      tone: 'danger',
      onConfirm: () => objetosApi.eliminar(o.id),
    });
    if (!ok) return;
    emitirCambio('objeto');
    toast.success('Objeto eliminado', { description: `«${o.nombre}» ya no se muestra a los estudiantes.` });
    navigate('/admin', { replace: true });
  };

  const aside = soloLectura ? (
    <>
      <div className="panel">
        <p className="panel__title">Entregado a</p>
        {o.reclamante ? (
          <div className="person">
            <span className="person__icon" aria-hidden="true">
              <UserRound />
            </span>
            <div>
              <p className="person__name">{o.reclamante.nombre}</p>
              <p className="person__meta">
                <span className="mono">{o.reclamante.matricula}</span> · {o.reclamante.programa}
              </p>
              <p className="person__meta">Reclamado el {formatFecha(o.fechaReclamo)}</p>
            </div>
          </div>
        ) : (
          <p className="panel__text">Sin registro del estudiante.</p>
        )}
        <p className="panel__text panel__text--small">Información de uso exclusivo del personal administrador. No la compartas con terceros.</p>
      </div>
      <Trazabilidad objeto={o} />
    </>
  ) : (
    <>
      <div className="panel">
        <p className="panel__title">Acciones</p>
        <p className="panel__text">Los datos de la izquierda son exactamente los que ven los estudiantes.</p>
        <div className="panel__actions">
          <Button to={`/admin/objetos/${o.id}/editar`} state={{ from: state?.from }} variant="secondary" icon={PencilLine} block>
            Editar
          </Button>
        </div>
        <div className="panel__danger">
          <p className="panel__danger-text">Eliminar retira el objeto de la consulta de los estudiantes.</p>
          <Button variant="danger-soft" icon={Trash2} block onClick={eliminar}>
            Eliminar
          </Button>
        </div>
      </div>

      {o.peticiones.length > 0 && (
        <div className="panel">
          <p className="panel__title">Peticiones de este objeto</p>
          <ul className="minilist">
            {o.peticiones.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/peticiones?id=${p.id}`} className="minilist__row">
                  <div>
                    <TipoPeticionBadge tipo={p.tipo} />
                    <p className="minilist__who">{p.solicitante?.nombre}</p>
                    <p className="minilist__meta mono">
                      {p.folio} · {p.matricula}
                    </p>
                  </div>
                  <EstadoPeticionBadge peticion={p} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Trazabilidad objeto={o} />
    </>
  );

  return (
    <>
      {regresar}
      {soloLectura && (
        <Alert tone="info" className="readonly-banner">
          Vista de solo lectura: los objetos del historial no se pueden modificar.
        </Alert>
      )}
      <ObjetoDetalle objeto={o} aside={aside} />
    </>
  );
}
