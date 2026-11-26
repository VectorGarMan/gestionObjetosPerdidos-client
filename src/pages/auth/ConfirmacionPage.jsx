import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Briefcase, GraduationCap } from 'lucide-react';
import { AuthLayout } from './AuthLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Feedback.jsx';
import { rutaInicio, useSession } from '../../context/SessionContext.jsx';
import { iniciales } from '../../utils/format.js';
import { toast } from 'sonner';

/** PNT-02 · Inicio de sesión 2: confirmación de datos (solo lectura). */
export function ConfirmacionPage() {
  const { usuario, pendiente, setPendiente, confirmar } = useSession();
  const navigate = useNavigate();

  if (usuario) return <Navigate to={rutaInicio(usuario.rol)} replace />;
  if (!pendiente) return <Navigate to="/" replace />;

  const esAdmin = pendiente.rol === 'ADMINISTRADOR';

  const acceder = () => {
    const u = confirmar();
    if (!u) return navigate('/', { replace: true });
    toast.success(`Hola, ${u.nombre.split(' ')[0]}`, { description: esAdmin ? 'Entraste al panel administrativo.' : 'Ya puedes buscar tus objetos.' });
    navigate(rutaInicio(u.rol), { replace: true });
  };

  const regresar = () => {
    setPendiente(null);
    navigate('/', { replace: true });
  };

  return (
    <AuthLayout>
      <header className="auth__card-head">
        <p className="auth__step-indicator">
          <BadgeCheck aria-hidden="true" /> Cuenta encontrada
        </p>
        <h2 className="auth__title">Confirma tus datos</h2>
        <p className="auth__subtitle">Verifica que la cuenta reconocida sea la tuya antes de entrar.</p>
      </header>

      <div className="idcard">
        <div className="idcard__top">
          <span className={`avatar avatar--xl ${esAdmin ? 'avatar--admin' : ''}`} aria-hidden="true">
            {iniciales(pendiente.nombre)}
          </span>
          <div>
            <p className="idcard__name">{pendiente.nombre}</p>
            <Badge tone={esAdmin ? 'navy' : 'blue'} icon={esAdmin ? Briefcase : GraduationCap}>
              {esAdmin ? 'Administrador' : 'Estudiante'}
            </Badge>
          </div>
        </div>
        <dl className="idcard__data">
          <div>
            <dt>Nombre</dt>
            <dd>{pendiente.nombre}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{pendiente.correo}</dd>
          </div>
          <div>
            <dt>{esAdmin ? 'Número de empleado' : 'Matrícula'}</dt>
            <dd className="mono">{pendiente.matricula}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{esAdmin ? 'Administrador' : 'Estudiante'}</dd>
          </div>
        </dl>
      </div>

      <div className="auth__actions">
        <Button size="lg" block onClick={acceder} iconRight={ArrowRight} autoFocus>
          Acceder
        </Button>
        <button type="button" className="auth__back" onClick={regresar}>
          <ArrowLeft aria-hidden="true" />
          Regresar, esta no es mi cuenta
        </button>
      </div>
    </AuthLayout>
  );
}
