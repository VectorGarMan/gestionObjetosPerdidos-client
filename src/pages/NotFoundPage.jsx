import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback.jsx';
import { Button } from '../components/ui/Button.jsx';
import { rutaInicio, useSession } from '../context/SessionContext.jsx';

export function NotFoundPage() {
  const { usuario } = useSession();
  return (
    <div className="notfound">
      <EmptyState icon={Compass} title="No encontramos esta página" action={<Button to={usuario ? rutaInicio(usuario.rol) : '/'}>Ir al inicio</Button>}>
        Es posible que el enlace haya cambiado o que no tengas acceso a esta sección.
      </EmptyState>
    </div>
  );
}
