import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CircleCheck, Info, Trash2, TriangleAlert } from 'lucide-react';
import { Dialog } from './Dialog.jsx';
import { Button } from './Button.jsx';
import { Alert } from './Feedback.jsx';

const ConfirmContext = createContext(null);

const TONOS = {
  primary: { icon: Info, variant: 'primary' },
  success: { icon: CircleCheck, variant: 'success' },
  warning: { icon: TriangleAlert, variant: 'primary' },
  danger: { icon: Trash2, variant: 'danger' },
};

/**
 * Proveedor de confirmaciones basado en promesas:
 *   const ok = await confirm({ title, message, confirmLabel, tone, onConfirm })
 * Si se pasa `onConfirm`, la acción se ejecuta dentro del diálogo (con estado de carga)
 * y los errores se muestran ahí mismo sin cerrar.
 */
export function ConfirmProvider({ children }) {
  const [estado, setEstado] = useState({ open: false, opts: {} });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const resolver = useRef(null);

  const confirm = useCallback((opts) => {
    setError('');
    setCargando(false);
    setEstado({ open: true, opts });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const cerrar = (resultado) => {
    if (cargando) return;
    setEstado((s) => ({ ...s, open: false }));
    resolver.current?.(resultado);
    resolver.current = null;
  };

  const aceptar = async () => {
    const { onConfirm } = estado.opts;
    if (!onConfirm) return cerrar(true);
    setCargando(true);
    setError('');
    try {
      await onConfirm();
      setCargando(false);
      setEstado((s) => ({ ...s, open: false }));
      resolver.current?.(true);
      resolver.current = null;
    } catch (e) {
      setCargando(false);
      setError(e?.message || 'Ocurrió un error. Inténtalo de nuevo.');
    }
  };

  const { title, message, details, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'primary' } = estado.opts;
  const t = TONOS[tone] ?? TONOS.primary;
  const Icon = t.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={estado.open}
        onClose={() => cerrar(false)}
        title={title}
        size="sm"
        className={`confirm confirm--${tone}`}
        icon={<Icon aria-hidden="true" />}
        dismissible={!cargando}
        footer={
          <>
            <Button variant="ghost" onClick={() => cerrar(false)} disabled={cargando}>
              {cancelLabel}
            </Button>
            <Button variant={t.variant} onClick={aceptar} loading={cargando} autoFocus>
              {confirmLabel}
            </Button>
          </>
        }
      >
        {message && <p className="confirm__msg">{message}</p>}
        {details}
        {error && (
          <Alert tone="danger" className="confirm__error">
            {error}
          </Alert>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}
