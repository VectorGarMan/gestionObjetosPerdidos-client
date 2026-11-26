import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, PackageX, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Field } from '../../components/ui/Field.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert, ColorSwatch, EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { useConfirm } from '../../components/ui/ConfirmProvider.jsx';
import { ImageDrop } from '../../components/objetos/ImageDrop.jsx';
import { ObjetoCard } from '../../components/objetos/ObjetoCard.jsx';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { objetosApi } from '../../services/api.js';
import { emitirCambio } from '../../utils/events.js';
import { formatFechaLarga, hoyISO } from '../../utils/format.js';
import { reglasObjeto } from '../../utils/validators.js';

const VACIO = {
  fotografiaUrl: null,
  nombre: '',
  descripcion: '',
  marca: '',
  tipoObjetoId: '',
  colorId: '',
  otrasEtiquetaIds: [],
  lugarPerdida: '',
  moduloId: '',
};

const ORDEN = ['fotografia', 'nombre', 'descripcion', 'marca', 'tipoObjetoId', 'colorId', 'lugarPerdida', 'moduloId'];

function aFormulario(o) {
  return {
    fotografiaUrl: o.fotografiaUrl,
    nombre: o.nombre,
    descripcion: o.descripcion,
    marca: o.marca ?? '',
    tipoObjetoId: String(o.tipoObjetoId),
    colorId: String(o.colorId),
    otrasEtiquetaIds: [...o.otrasEtiquetaIds],
    lugarPerdida: o.lugarPerdida,
    moduloId: String(o.moduloId),
  };
}

/** Contenedor: carga el objeto en modo edición antes de mostrar el formulario. */
export function ObjetoFormPage() {
  const { id } = useParams();
  const edicion = Boolean(id);
  const { data, loading, error } = useAsync(() => (edicion ? objetosApi.obtener(id) : Promise.resolve(null)), [id]);

  if (edicion && loading) {
    return (
      <div className="form-layout" aria-busy="true">
        <div className="form-main">
          <Skeleton style={{ height: 32, width: 280 }} />
          <Skeleton style={{ height: 360, width: '100%', marginTop: 24, borderRadius: 16 }} />
        </div>
      </div>
    );
  }
  if (edicion && (error || !data)) {
    return <EmptyState icon={PackageX} tone="danger" title="No encontramos este objeto" action={<Button to="/admin" variant="secondary">Volver</Button>} />;
  }
  if (edicion && data.estado !== 'PERDIDO') {
    return (
      <EmptyState icon={PackageX} tone="warning" title="Este objeto ya fue reclamado" action={<Button to={`/admin/historial/${data.id}`} variant="secondary">Ver en historial</Button>}>
        Los objetos del historial son de solo lectura.
      </EmptyState>
    );
  }
  return <ObjetoForm key={id ?? 'nuevo'} original={data} />;
}

/** PNT-07 · Alta de objeto perdido (y edición desde PNT-06), formulario F-04. */
function ObjetoForm({ original }) {
  const edicion = Boolean(original);
  const cat = useCatalogos();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { state } = useLocation();
  const inicial = useMemo(() => (original ? aFormulario(original) : VACIO), [original]);
  const [form, setForm] = useState(inicial);
  const [tocados, setTocados] = useState({});
  const [errorFoto, setErrorFoto] = useState('');
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const guardado = useRef(false);
  const raiz = useRef(null);
  const fechaRegistro = original?.fechaRegistro ?? hoyISO();
  const fotoOpcional = edicion && !original.fotografiaUrl; // registros de demostración sin foto

  const sucio = JSON.stringify(form) !== JSON.stringify(inicial);

  const errores = useMemo(() => {
    const e = {};
    e.fotografia = errorFoto || (fotoOpcional ? '' : reglasObjeto.fotografia(form.fotografiaUrl));
    ['nombre', 'descripcion', 'marca', 'tipoObjetoId', 'colorId', 'lugarPerdida', 'moduloId'].forEach((k) => (e[k] = reglasObjeto[k](form[k])));
    return e;
  }, [form, errorFoto, fotoOpcional]);

  const hayErrores = Object.values(errores).some(Boolean);
  const err = (k) => ((tocados[k] || intentoEnvio) && errores[k]) || '';
  const tocar = (k) => setTocados((t) => ({ ...t, [k]: true }));
  const cambiar = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const recortar = (k) => {
    setForm((f) => ({ ...f, [k]: f[k].replace(/\s+/g, ' ').trim() }));
    tocar(k);
  };

  // Advertencia al salir con datos capturados.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => sucio && !guardado.current && currentLocation.pathname !== nextLocation.pathname);

  const blockerRef = useRef(blocker);
  useEffect(() => {
    blockerRef.current = blocker;
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({
      title: 'Salir sin guardar',
      message: 'Hay información sin guardar. Si sales ahora, se perderá.',
      confirmLabel: 'Salir sin guardar',
      cancelLabel: 'Seguir editando',
      tone: 'warning',
    }).then((ok) => (ok ? blockerRef.current.proceed?.() : blockerRef.current.reset?.()));
  }, [blocker.state, confirm]);

  useEffect(() => {
    if (!sucio) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [sucio]);

  const destinoCancelar = edicion ? `/admin/objetos/${original.id}` : '/admin';

  const enviar = async (e) => {
    e.preventDefault();
    setIntentoEnvio(true);
    if (hayErrores) {
      const primero = ORDEN.find((k) => errores[k]);
      raiz.current?.querySelector(`[data-campo="${primero}"] :is(input:not([type=file]), select, textarea, button)`)?.focus();
      return;
    }
    const m = cat.modulo(form.moduloId);
    const datos = {
      ...form,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      marca: form.marca.trim(),
      lugarPerdida: form.lugarPerdida.trim(),
      tipoObjetoId: Number(form.tipoObjetoId),
      colorId: Number(form.colorId),
      moduloId: Number(form.moduloId),
      fechaRegistro,
    };
    let resultado = null;
    const ok = await confirm({
      title: edicion ? 'Guardar cambios' : 'Registrar objeto',
      message: edicion
        ? `¿Guardar los cambios de «${datos.nombre}»? La información actualizada se mostrará a los estudiantes.`
        : `¿Registrar «${datos.nombre}» en ${m?.nombre ?? 'el módulo'}? Quedará visible para los estudiantes.`,
      confirmLabel: edicion ? 'Guardar cambios' : 'Registrar objeto',
      tone: 'primary',
      onConfirm: async () => {
        resultado = edicion ? await objetosApi.actualizar(original.id, datos) : await objetosApi.crear(datos);
      },
    });
    if (!ok) return;
    guardado.current = true;
    emitirCambio('objeto');
    if (edicion) {
      toast.success('Cambios guardados', { description: `«${resultado.nombre}» se actualizó para los estudiantes.` });
      navigate(`/admin/objetos/${original.id}`, { replace: true, state });
    } else {
      toast.success('Objeto registrado', { description: `${resultado.folio} · «${resultado.nombre}» ya es visible para los estudiantes.` });
      navigate('/admin', { replace: true });
    }
  };

  const vistaPrevia = {
    id: 0,
    folio: original?.folio ?? 'OP-NUEVO',
    estado: 'PERDIDO',
    nombre: form.nombre.trim() || 'Nombre del objeto',
    descripcion: form.descripcion.trim() || 'La descripción aparecerá aquí para que su dueño lo reconozca.',
    marca: form.marca.trim(),
    tipoObjetoId: Number(form.tipoObjetoId) || null,
    colorId: Number(form.colorId) || null,
    otrasEtiquetaIds: form.otrasEtiquetaIds,
    lugarPerdida: form.lugarPerdida.trim() || 'Lugar de pérdida',
    moduloId: Number(form.moduloId) || null,
    fotografiaUrl: form.fotografiaUrl,
    fechaRegistro,
  };

  const desc = form.descripcion.trim().length;

  return (
    <form ref={raiz} className="form-layout page-enter" onSubmit={enviar} noValidate>
      <div className="form-main">
        <Link to={destinoCancelar} className="back-link">
          <ChevronLeft aria-hidden="true" />
          {edicion ? 'Regresar al detalle' : 'Regresar a objetos perdidos'}
        </Link>
        <header className="page-head">
          <div>
            <p className="page-head__eyebrow">{edicion ? `Edición · ${original.folio}` : 'Nuevo registro'}</p>
            <h1 className="page-head__title">{edicion ? 'Editar objeto' : 'Dar de alta objeto'}</h1>
            <p className="page-head__sub">Los campos marcados con * son obligatorios. Sin etiquetas completas, el objeto no aparecería en las búsquedas.</p>
          </div>
        </header>

        {intentoEnvio && hayErrores && (
          <Alert tone="danger" className="form-alert">
            Completa los campos obligatorios marcados con * para registrar el objeto.
          </Alert>
        )}

        <section className="fsection">
          <div className="fsection__head">
            <span className="fsection__num mono">01</span>
            <div>
              <h2 className="fsection__title">Fotografía</h2>
              <p className="fsection__desc">El estudiante reconoce su objeto por la imagen.</p>
            </div>
          </div>
          <div data-campo="fotografia">
            <Field label="Fotografía del objeto" required={!fotoOpcional} error={err('fotografia')} hint={fotoOpcional ? 'Este registro de demostración no tiene fotografía; agrega una cuando puedas.' : 'Formatos permitidos: JPG o PNG. Tamaño máximo: 5 MB.'}>
              {(a11y) => (
                <ImageDrop
                  a11y={a11y}
                  value={form.fotografiaUrl}
                  onChange={(url) => {
                    cambiar('fotografiaUrl', url);
                    tocar('fotografia');
                  }}
                  onError={(m) => {
                    setErrorFoto(m);
                    if (m) tocar('fotografia');
                  }}
                />
              )}
            </Field>
          </div>
        </section>

        <section className="fsection">
          <div className="fsection__head">
            <span className="fsection__num mono">02</span>
            <div>
              <h2 className="fsection__title">Datos del objeto</h2>
              <p className="fsection__desc">Describe rasgos visibles, pero guarda uno que solo el dueño pueda confirmar.</p>
            </div>
          </div>
          <div className="fgrid">
            <div data-campo="nombre">
              <Field label="Nombre del objeto" required error={err('nombre')} counter={{ text: `${form.nombre.length}/60`, over: form.nombre.length > 60 }}>
                {(a11y) => (
                  <input {...a11y} className="control" maxLength={70} placeholder="Ej. Mochila negra" value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} onBlur={() => recortar('nombre')} />
                )}
              </Field>
            </div>
            <div data-campo="marca">
              <Field label="Marca" error={err('marca')} hint="Opcional, si es visible." counter={form.marca ? { text: `${form.marca.length}/40`, over: form.marca.length > 40 } : undefined}>
                {(a11y) => (
                  <input {...a11y} className="control" maxLength={50} placeholder="Ej. JanSport" value={form.marca} onChange={(e) => cambiar('marca', e.target.value)} onBlur={() => recortar('marca')} />
                )}
              </Field>
            </div>
            <div data-campo="descripcion" className="fgrid__full">
              <Field label="Descripción" required error={err('descripcion')} counter={{ text: `${desc}/250`, over: desc > 250 }}>
                {(a11y) => (
                  <textarea
                    {...a11y}
                    className="control"
                    rows={4}
                    placeholder="Ej. Mochila de dos compartimentos con un parche en la bolsa frontal."
                    value={form.descripcion}
                    onChange={(e) => cambiar('descripcion', e.target.value)}
                    onBlur={() => tocar('descripcion')}
                  />
                )}
              </Field>
            </div>
          </div>
        </section>

        <section className="fsection">
          <div className="fsection__head">
            <span className="fsection__num mono">03</span>
            <div>
              <h2 className="fsection__title">Etiquetas</h2>
              <p className="fsection__desc">Son los mismos catálogos que usan los estudiantes para filtrar.</p>
            </div>
          </div>
          <div className="fgrid">
            <div data-campo="tipoObjetoId">
              <Field label="Tipo de objeto" required error={err('tipoObjetoId')}>
                {(a11y) => <Select {...a11y} options={cat.tiposObjeto} placeholder="Selecciona…" value={form.tipoObjetoId} onChange={(v) => (cambiar('tipoObjetoId', v), tocar('tipoObjetoId'))} onBlur={() => tocar('tipoObjetoId')} />}
              </Field>
            </div>
            <div data-campo="colorId">
              <Field label="Color" required error={err('colorId')}>
                {(a11y) => <Select {...a11y} options={cat.colores} placeholder="Selecciona…" value={form.colorId} onChange={(v) => (cambiar('colorId', v), tocar('colorId'))} onBlur={() => tocar('colorId')} />}
              </Field>
            </div>
            <fieldset className="fgrid__full chipfield">
              <legend className="field__label">
                Otras etiquetas <span className="muted">(opcional)</span>
              </legend>
              <div className="chipgroup chipgroup--wrap">
                {cat.etiquetas.map((e) => {
                  const on = form.otrasEtiquetaIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className="chipopt"
                      aria-pressed={on}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          otrasEtiquetaIds: f.otrasEtiquetaIds.includes(e.id) ? f.otrasEtiquetaIds.filter((x) => x !== e.id) : [...f.otrasEtiquetaIds, e.id],
                        }))
                      }
                    >
                      {on && <Check aria-hidden="true" />}
                      {e.nombre}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </section>

        <section className="fsection">
          <div className="fsection__head">
            <span className="fsection__num mono">04</span>
            <div>
              <h2 className="fsection__title">Ubicación y resguardo</h2>
              <p className="fsection__desc">Indica dónde se encontró y a qué módulo debe acudir el estudiante.</p>
            </div>
          </div>
          <div className="fgrid">
            <div data-campo="lugarPerdida">
              <Field label="Lugar de pérdida" required error={err('lugarPerdida')} counter={{ text: `${form.lugarPerdida.length}/80`, over: form.lugarPerdida.length > 80 }}>
                {(a11y) => (
                  <input {...a11y} className="control" maxLength={90} placeholder="Ej. Biblioteca, segundo piso" value={form.lugarPerdida} onChange={(e) => cambiar('lugarPerdida', e.target.value)} onBlur={() => recortar('lugarPerdida')} />
                )}
              </Field>
            </div>
            <div data-campo="moduloId">
              <Field label="Módulo de resguardo" required error={err('moduloId')} hint={cat.modulo(form.moduloId)?.ubicacion}>
                {(a11y) => <Select {...a11y} options={cat.modulos.map((m) => ({ id: m.id, nombre: `${m.nombre} · ${m.ubicacion}` }))} placeholder="Selecciona…" value={form.moduloId} onChange={(v) => (cambiar('moduloId', v), tocar('moduloId'))} onBlur={() => tocar('moduloId')} />}
              </Field>
            </div>
            <div>
              <Field label="Fecha de registro" hint="Se asigna automáticamente.">
                {(a11y) => <input {...a11y} className="control" readOnly value={formatFechaLarga(fechaRegistro)} />}
              </Field>
            </div>
          </div>
        </section>

        <Alert tone="warning" title="Protege los datos personales" className="form-privacy">
          No muestres nombres, números ni datos personales en la foto o la descripción. Consulta el{' '}
          <a href="/aviso-de-privacidad" target="_blank" rel="noopener">
            Aviso de Privacidad
          </a>{' '}
          y los{' '}
          <a href="/terminos-y-condiciones" target="_blank" rel="noopener">
            Términos y Condiciones
          </a>
          .
        </Alert>

        <div className="form-actions">
          <Button variant="ghost" onClick={() => navigate(destinoCancelar)}>
            Cancelar
          </Button>
          <Button type="submit" icon={edicion ? Save : undefined} size="lg">
            {edicion ? 'Guardar cambios' : 'Registrar objeto'}
          </Button>
        </div>
      </div>

      <aside className="form-aside" aria-label="Vista previa">
        <div className="form-aside__sticky">
          <p className="form-aside__title">Así lo verán los estudiantes</p>
          <ul className="ogrid ogrid--single">
            <ObjetoCard objeto={vistaPrevia} />
          </ul>
          <ul className="checklist" aria-label="Progreso del registro">
            {[
              ['Fotografía', !errores.fotografia],
              ['Nombre y descripción', !errores.nombre && !errores.descripcion],
              ['Tipo y color', !errores.tipoObjetoId && !errores.colorId],
              ['Lugar y módulo', !errores.lugarPerdida && !errores.moduloId],
            ].map(([t, ok]) => (
              <li key={t} className={ok ? 'is-done' : ''}>
                <span className="checklist__mark" aria-hidden="true">
                  <Check />
                </span>
                {t}
                <span className="sr-only">{ok ? ' completo' : ' pendiente'}</span>
              </li>
            ))}
          </ul>
          {cat.color(form.colorId) && (
            <p className="form-aside__note">
              <ColorSwatch color={cat.color(form.colorId)} /> Se mostrará con el color «{cat.color(form.colorId).nombre}».
            </p>
          )}
          <p className="form-aside__note">
            <ShieldAlert aria-hidden="true" /> Revisa que la foto no muestre datos personales.
          </p>
        </div>
      </aside>
    </form>
  );
}
