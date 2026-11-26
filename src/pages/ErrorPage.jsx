import { useRouteError } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback.jsx';
import { Button } from '../components/ui/Button.jsx';

/** Límite de error de las rutas: evita pantallas técnicas ante un fallo inesperado. */
export function ErrorPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="notfound">
      <EmptyState
        icon={TriangleAlert}
        tone="danger"
        title="Algo salió mal"
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recargar la página
          </Button>
        }
      >
        Ocurrió un error inesperado. Recarga la página; si el problema continúa, avisa al personal administrador.
      </EmptyState>
    </div>
  );
}
