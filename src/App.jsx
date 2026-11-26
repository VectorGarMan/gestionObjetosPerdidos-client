import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SessionProvider, rutaInicio, useSession } from './context/SessionContext.jsx';
import { CatalogosProvider } from './context/CatalogosContext.jsx';
import { ConfirmProvider } from './components/ui/ConfirmProvider.jsx';
import { StudentLayout, AdminLayout } from './components/layout/Layouts.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { ConfirmacionPage } from './pages/auth/ConfirmacionPage.jsx';
import { ExplorarPage } from './pages/estudiante/ExplorarPage.jsx';
import { DetalleEstudiantePage } from './pages/estudiante/DetalleEstudiantePage.jsx';
import { MisSolicitudesPage } from './pages/estudiante/MisSolicitudesPage.jsx';
import { PanelAdminPage } from './pages/admin/PanelAdminPage.jsx';
import { DetalleAdminPage } from './pages/admin/DetalleAdminPage.jsx';
import { ObjetoFormPage } from './pages/admin/ObjetoFormPage.jsx';
import { PeticionesPage } from './pages/admin/PeticionesPage.jsx';
import { HistorialPage } from './pages/admin/HistorialPage.jsx';
import { LegalPage } from './pages/legal/LegalPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { ErrorPage } from './pages/ErrorPage.jsx';

/** Protege las rutas por rol (separación de funciones). */
function RequireRol({ rol }) {
  const { usuario } = useSession();
  if (!usuario) return <Navigate to="/" replace />;
  if (usuario.rol !== rol) return <Navigate to={rutaInicio(usuario.rol)} replace />;
  return <Outlet />;
}

function Root() {
  return (
    <>
      <ScrollRestoration getKey={(location) => location.pathname} />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/confirmar', element: <ConfirmacionPage /> },
      { path: '/aviso-de-privacidad', element: <LegalPage doc="privacidad" /> },
      { path: '/terminos-y-condiciones', element: <LegalPage doc="terminos" /> },
      {
        element: <RequireRol rol="ESTUDIANTE" />,
        children: [
          {
            path: '/estudiante',
            element: <StudentLayout />,
            children: [
              { index: true, element: <ExplorarPage /> },
              { path: 'objetos/:id', element: <DetalleEstudiantePage /> },
              { path: 'solicitudes', element: <MisSolicitudesPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRol rol="ADMINISTRADOR" />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <PanelAdminPage /> },
              { path: 'objetos/nuevo', element: <ObjetoFormPage /> },
              { path: 'objetos/:id', element: <DetalleAdminPage /> },
              { path: 'objetos/:id/editar', element: <ObjetoFormPage /> },
              { path: 'peticiones', element: <PeticionesPage /> },
              { path: 'historial', element: <HistorialPage /> },
              { path: 'historial/:id', element: <DetalleAdminPage soloLectura /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return (
    <SessionProvider>
      <CatalogosProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors closeButton duration={4500} toastOptions={{ className: 'toast' }} />
        </ConfirmProvider>
      </CatalogosProvider>
    </SessionProvider>
  );
}
