import { useCallback } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, CircleCheck, Clock, FileWarning, Hand, PackageX, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ObjetoDetalle, ObjetoDetalleSkeleton, ModuloCard } from '../../components/objetos/ObjetoDetalle.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert, EmptyState } from '../../components/ui/Feedback.jsx';
import { useConfirm } from '../../components/ui/ConfirmProvider.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useSession } from '../../context/SessionContext.jsx';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { objetosApi, peticionesApi } from '../../services/api.js';
import { emitirCambio } from '../../utils/events.js';
import { formatFecha, formatFechaHora } from '../../utils/format.js';

/** PNT-04 · Detalle del objeto para el estudiante. */
export function DetalleEstudiantePage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { usuario } = useSession();
  const { modulo } = useCatalogos();
  const confirm = useConfirm();
  const volverA = `/estudiante${state?.from ? `?${state.from}` : ''}`;

  const objeto = useAsync(() => objetosApi.obtener(id), [id]);
  const mias = useAsync(() => peticionesApi.listar({ matricula: usuario.matricula }), [usuario.matricula]);

  const recargarTodo = useCallback(() => {
    objeto.recargar({ silencioso: true });
    mias.recargar({ silencioso: true });
  }, [objeto, mias]);

  const regresar = (
    <Link to={volverA} className="back-link">
      <ChevronLeft aria-hidden="true" />
      Regresar a los resultados
    </Link>
  );

  if (objeto.loading) {
    return (
      <>
        {regresar}
        <ObjetoDetalleSkeleton />
      </>
    );
  }

  if (objeto.error || !objeto.data) {
    return (
      <>
        {regresar}
        <EmptyState icon={PackageX} tone="danger" title="Este objeto ya no está disponible" action={<Button to={volverA} variant="secondary">Volver a la lista</Button>}>
          {objeto.error?.message ?? 'Es posible que haya sido eliminado o entregado.'}
        </EmptyState>
      </>
    );
  }

  const o = objeto.data;
  const perdido = o.estado === 'PERDIDO';
  const tipo = perdido ? 'RECLAMO' : 'RECLAMO_ERROR';
  const m = modulo(o.moduloId);
  const pendiente = mias.data?.find((p) => p.objetoId === o.id && p.estado === 'PENDIENTE' && p.tipo === tipo);
  const esMio = !perdido && o.reclamadoPor === usuario.matricula;

  const reclamar = async () => {
    const ok = await confirm({
      title: perdido ? 'Reclamar objeto' : 'Reportar reclamo de error',
      message: perdido
        ? `¿Deseas reclamar «${o.nombre}»? Se enviará una petición al personal administrador y deberás acudir a ${m?.nombre ?? 'el módulo'} para recogerlo.`
        : `¿Deseas reportar que «${o.nombre}» fue reclamado por error por otra persona? El personal administrador revisará el caso.`,
      details: !perdido && (
        <p className="confirm__note">
          <ShieldCheck aria-hidden="true" />
          Reportar un objeto ajeno o de mala fe puede considerarse una falta según la normativa de la universidad.
        </p>
      ),
      confirmLabel: perdido ? 'Sí, reclamar' : 'Sí, reportar',
      tone: perdido ? 'primary' : 'warning',
      onConfirm: async () => {
        try {
          const p = await peticionesApi.crear({ objetoId: o.id, tipo, matricula: usuario.matricula });
          toast.success(perdido ? 'Petición enviada' : 'Reporte enviado', {
            description: perdido ? `Folio ${p.folio}. Acude a ${m?.nombre} con tu credencial.` : `Folio ${p.folio}. El personal te contactará.`,
          });
        } catch (e) {
          if (e.code === 'OBJETO_CAMBIO_ESTADO' || e.code === 'PETICION_DUPLICADA') recargarTodo();
          throw e;
        }
      },
    });
    if (ok) {
      emitirCambio('peticion');
      recargarTodo();
    }
  };

  const accion = esMio ? (
    <div className="panel">
      <p className="panel__title">Este objeto te fue entregado</p>
      <p className="panel__text">Lo recogiste el {formatFecha(o.fechaReclamo)}. Si hay algún problema, acude al módulo.</p>
    </div>
  ) : pendiente ? (
    <div className="panel panel--status">
      <span className="panel__status-icon" aria-hidden="true">
        <Clock />
      </span>
      <p className="panel__title">{perdido ? 'Tu petición está en revisión' : 'Tu reporte está en revisión'}</p>
      <p className="panel__text">
        Folio <span className="mono">{pendiente.folio}</span> · enviado el {formatFechaHora(pendiente.fechaCreacion)}.
      </p>
      <Alert tone="warning" className="panel__alert">
        Ya tienes una petición pendiente para este objeto.
      </Alert>
      <Button to="/estudiante/solicitudes" variant="secondary" block>
        Ver mis solicitudes
      </Button>
    </div>
  ) : perdido ? (
    <div className="panel">
      <p className="panel__title">¿Es tuyo?</p>
      <p className="panel__text">Envía una petición y recógelo en el módulo. Te pedirán describir un rasgo que solo el dueño conoce.</p>
      <div className="panel__actions">
        <Button size="lg" block icon={Hand} onClick={reclamar} disabled={mias.loading}>
          Reclamar
        </Button>
      </div>
    </div>
  ) : (
    <div className="panel">
      <p className="panel__title">¿Alguien se llevó algo tuyo?</p>
      <p className="panel__text">Si este objeto es tuyo y no lo recogiste, repórtalo. El personal administrador contactará a quien lo reclamó.</p>
      <div className="panel__actions">
        <Button size="lg" block variant="danger-soft" icon={FileWarning} onClick={reclamar} disabled={mias.loading}>
          Reclamar error
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {regresar}
      <ObjetoDetalle
        objeto={o}
        aside={
          <>
            {accion}
            <ModuloCard moduloId={o.moduloId} titulo={perdido ? 'Dónde recogerlo' : 'Módulo responsable'} />
            <p className="privacy-note">
              <CircleCheck aria-hidden="true" />
              Por privacidad, no mostramos los datos de quien haya reclamado antes un objeto.
            </p>
          </>
        }
      />
    </>
  );
}
