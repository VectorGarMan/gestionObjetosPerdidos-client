import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, CircleCheck, Lock, Mail, Phone, ShieldAlert, UserRound, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '../ui/Dialog.jsx';
import { Button } from '../ui/Button.jsx';
import { Alert, Skeleton } from '../ui/Feedback.jsx';
import { useConfirm } from '../ui/ConfirmProvider.jsx';
import { ObjetoThumb } from '../objetos/ObjetoThumb.jsx';
import { TipoPeticionBadge, EstadoPeticionBadge } from './PeticionBadges.jsx';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { peticionesApi } from '../../services/api.js';
import { emitirCambio } from '../../utils/events.js';
import { formatFecha, formatFechaHora } from '../../utils/format.js';

function Dato({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Panel lateral con el detalle completo de una petición (PNT-08). */
export function PeticionDetalle({ peticion, onClose, onCambio }) {
  const { modulo } = useCatalogos();
  const { usuario } = useSession();
  const confirm = useConfirm();
  const [contacto, setContacto] = useState({ estado: 'oculto', data: null, error: null });

  // Conserva la última petición para que el contenido no desaparezca durante la animación de salida,
  // y oculta de nuevo el contacto previo al cambiar de petición.
  const [ultima, setUltima] = useState(peticion);
  if (peticion && peticion !== ultima) {
    if (peticion.id !== ultima?.id) setContacto({ estado: 'oculto', data: null, error: null });
    setUltima(peticion);
  }
  const p = peticion ?? ultima;
  const abierto = Boolean(peticion);
  const esError = p?.tipo === 'RECLAMO_ERROR';
  const liberada = p?.estado === 'LIBERADA';
  const bloqueada = !esError && !liberada && p?.objeto?.estado === 'RECLAMADO';
  const m = p?.objeto ? modulo(p.objeto.moduloId) : null;

  const verContacto = async () => {
    setContacto({ estado: 'cargando', data: null, error: null });
    try {
      const data = await peticionesApi.contactoPrevio(p.id);
      setContacto({ estado: 'visible', data, error: null });
    } catch (error) {
      setContacto({ estado: 'error', data: null, error });
    }
  };

  const liberar = async () => {
    let resultado;
    const ok = await confirm({
      title: esError ? 'Liberar reclamo de error' : 'Confirmar entrega',
      message: esError
        ? 'Al liberar esta petición confirmas que el problema ya se resolvió y que contactaste al estudiante que reclamó antes el objeto. ¿Deseas continuar?'
        : `¿Confirmas que «${p.objeto?.nombre}» fue entregado al estudiante? La petición se liberará y el objeto pasará al historial.`,
      confirmLabel: esError ? 'Sí, liberar' : 'Sí, fue entregado',
      tone: 'success',
      onConfirm: async () => {
        try {
          resultado = await peticionesApi.liberar(p.id, { administrador: usuario.nombre });
        } catch (e) {
          if (e.code === 'PETICION_LIBERADA' || e.code === 'OBJETO_CAMBIO_ESTADO') onCambio?.();
          throw e;
        }
      },
    });
    if (!ok) return;
    emitirCambio('peticion');
    onCambio?.(resultado);
    toast.success(esError ? 'Reclamo de error resuelto' : 'Objeto entregado', {
      description: esError ? `Petición ${p.folio} liberada.` : `«${p.objeto?.nombre}» pasó al historial.`,
    });
  };

  return (
    <Dialog
      open={abierto}
      onClose={onClose}
      variant="sheet"
      title={p ? (esError ? 'Reclamo de error' : 'Reclamo de objeto') : ''}
      description={p ? `Petición ${p.folio} · ${formatFechaHora(p.fechaCreacion)}` : ''}
      footer={
        p && (
          <div className="pdetail__footer">
            {esError && contacto.estado !== 'visible' && (
              <Button variant="secondary" icon={UsersRound} onClick={verContacto} loading={contacto.estado === 'cargando'} disabled={liberada}>
                Contactar estudiante
              </Button>
            )}
            <Button variant="success" icon={CircleCheck} onClick={liberar} disabled={liberada || bloqueada}>
              {liberada ? 'Petición liberada' : 'Liberar petición'}
            </Button>
          </div>
        )
      }
    >
      {p && (
        <div className="pdetail">
          <div className="pdetail__badges">
            <TipoPeticionBadge tipo={p.tipo} />
            <EstadoPeticionBadge peticion={p} />
          </div>

          {liberada &&
            (p.resolucion === 'NO_PROCEDE' ? (
              <Alert tone="info" title="No procede">
                El objeto se entregó a otro estudiante el {formatFechaHora(p.fechaLiberacion)}. Si este estudiante afirma que es suyo, puede registrar un reclamo de error.
              </Alert>
            ) : (
              <Alert tone="success" title={esError ? 'Caso resuelto' : 'Objeto entregado'}>
                Liberada el {formatFechaHora(p.fechaLiberacion)} por {p.liberadaPor}. Las acciones están deshabilitadas.
              </Alert>
            ))}
          {bloqueada && (
            <Alert tone="warning" title="El objeto ya fue entregado">
              Otro estudiante recibió este objeto. Esta petición no puede liberarse como entrega.
            </Alert>
          )}

          <section className="pdetail__section">
            <h3 className="pdetail__h">Objeto</h3>
            {p.objeto ? (
              <Link to={`/admin/${p.objeto.estado === 'RECLAMADO' ? 'historial' : 'objetos'}/${p.objeto.id}`} className="pdetail__obj">
                <ObjetoThumb objeto={p.objeto} size="small" />
                <div>
                  <p className="pdetail__obj-name">{p.objeto.nombre}</p>
                  <p className="pdetail__obj-meta">
                    <span className="mono">{p.objeto.folio}</span> · {p.objeto.lugarPerdida}
                  </p>
                  <p className="pdetail__obj-meta">
                    <Building2 aria-hidden="true" /> {m?.nombre} · {m?.ubicacion}
                  </p>
                </div>
                <ArrowUpRight className="pdetail__go" aria-hidden="true" />
              </Link>
            ) : (
              <p className="muted">El objeto fue eliminado.</p>
            )}
          </section>

          <section className="pdetail__section">
            <h3 className="pdetail__h">{esError ? 'Estudiante que reporta' : 'Estudiante que reclama'}</h3>
            <dl className="pdetail__dl">
              <Dato label="Nombre">{p.solicitante?.nombre ?? '—'}</Dato>
              <Dato label="Matrícula">
                <span className="mono">{p.matricula}</span>
              </Dato>
              <Dato label="Correo">{p.solicitante?.correo ?? '—'}</Dato>
              <Dato label="Programa">{p.solicitante?.programa ?? '—'}</Dato>
            </dl>
            {!esError && !liberada && !bloqueada && (
              <p className="pdetail__tip">
                <ShieldAlert aria-hidden="true" />
                Antes de entregar, pide al estudiante su credencial y un rasgo del objeto que no aparezca en la publicación.
              </p>
            )}
          </section>

          {esError && (
            <section className="pdetail__section">
              <h3 className="pdetail__h">Estudiante que reclamó antes el objeto</h3>
              {contacto.estado === 'oculto' && (
                <div className="pdetail__locked">
                  <Lock aria-hidden="true" />
                  <p>Los datos de contacto se muestran solo al pulsar «Contactar estudiante». El estudiante que reporta nunca los ve.</p>
                </div>
              )}
              {contacto.estado === 'cargando' && <Skeleton style={{ height: 120, width: '100%', borderRadius: 12 }} />}
              {contacto.estado === 'error' && <Alert tone="danger">{contacto.error.message}</Alert>}
              {contacto.estado === 'visible' && (
                <div className="contact">
                  <Alert tone="warning">Estos datos de contacto son solo para resolver este caso.</Alert>
                  <div className="person">
                    <span className="person__icon" aria-hidden="true">
                      <UserRound />
                    </span>
                    <div>
                      <p className="person__name">{contacto.data.nombre}</p>
                      <p className="person__meta">
                        <span className="mono">{contacto.data.matricula}</span> · {contacto.data.programa}
                      </p>
                      <p className="person__meta">Recibió el objeto el {formatFecha(contacto.data.fechaReclamo)}</p>
                    </div>
                  </div>
                  <div className="contact__actions">
                    <a className="btn btn--secondary btn--sm" href={`mailto:${contacto.data.correo}?subject=${encodeURIComponent(`Objetos Perdidos UNIVA · ${p.objeto?.folio ?? p.folio}`)}`}>
                      <Mail aria-hidden="true" />
                      {contacto.data.correo}
                    </a>
                    <a className="btn btn--secondary btn--sm" href={`tel:${contacto.data.telefono.replace(/\s/g, '')}`}>
                      <Phone aria-hidden="true" />
                      {contacto.data.telefono}
                    </a>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="pdetail__section">
            <h3 className="pdetail__h">Seguimiento</h3>
            <dl className="pdetail__dl">
              <Dato label="Creada">{formatFechaHora(p.fechaCreacion)}</Dato>
              <Dato label="Estado">{liberada ? 'Liberada' : 'Pendiente'}</Dato>
              {liberada && <Dato label="Liberada">{formatFechaHora(p.fechaLiberacion)}</Dato>}
              {liberada && <Dato label="Atendió">{p.liberadaPor}</Dato>}
            </dl>
          </section>
        </div>
      )}
    </Dialog>
  );
}
