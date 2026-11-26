import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../../context/SessionContext.jsx';
import { useConfirm } from '../ui/ConfirmProvider.jsx';
import { MODO_DEMO, restablecerDb } from '../../services/api.js';
import { emitirCambio } from '../../utils/events.js';
import { iniciales } from '../../utils/format.js';

export function UserMenu() {
  const { usuario, cerrarSesion } = useSession();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);
  const navigate = useNavigate();
  const confirm = useConfirm();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !raiz.current?.contains(e.target) && setAbierto(false);
    const esc = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  if (!usuario) return null;
  const esAdmin = usuario.rol === 'ADMINISTRADOR';

  const salir = () => {
    cerrarSesion();
    navigate('/', { replace: true });
    toast('Sesión cerrada', { description: 'Hasta pronto.' });
  };

  const restablecer = async () => {
    setAbierto(false);
    const ok = await confirm({
      title: 'Restablecer datos de demostración',
      message: 'Se borrarán los objetos, peticiones y cambios que hayas hecho en este navegador y se cargarán los datos de ejemplo originales.',
      confirmLabel: 'Restablecer',
      tone: 'warning',
    });
    if (!ok) return;
    restablecerDb();
    emitirCambio('reset');
    toast.success('Datos de demostración restablecidos');
    navigate(esAdmin ? '/admin' : '/estudiante');
  };

  return (
    <div className="usermenu" ref={raiz}>
      <button type="button" className="usermenu__trigger" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
        <span className={`avatar ${esAdmin ? 'avatar--admin' : ''}`} aria-hidden="true">
          {iniciales(usuario.nombre)}
        </span>
        <span className="usermenu__who">
          <span className="usermenu__name">{usuario.nombre.split(' ').slice(0, 2).join(' ')}</span>
          <span className="usermenu__role">{esAdmin ? 'Administrador' : `Estudiante · ${usuario.matricula}`}</span>
        </span>
        <ChevronDown className="usermenu__chev" aria-hidden="true" />
      </button>

      <div className="popover usermenu__pop" data-open={abierto || undefined} role="menu" aria-label="Menú de usuario">
        <div className="usermenu__card">
          <span className={`avatar avatar--lg ${esAdmin ? 'avatar--admin' : ''}`} aria-hidden="true">
            {iniciales(usuario.nombre)}
          </span>
          <div>
            <p className="usermenu__full">{usuario.nombre}</p>
            <p className="usermenu__mail">{usuario.correo}</p>
          </div>
        </div>
        {MODO_DEMO && (
          <button type="button" role="menuitem" className="menuitem" onClick={restablecer}>
            <RotateCcw aria-hidden="true" />
            Restablecer datos de demostración
          </button>
        )}
        <button type="button" role="menuitem" className="menuitem menuitem--danger" onClick={salir}>
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
