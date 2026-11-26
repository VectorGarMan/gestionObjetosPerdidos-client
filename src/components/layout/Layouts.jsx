import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { History, Inbox, Menu, PackagePlus, PackageSearch, ScanSearch, ClipboardList } from 'lucide-react';
import { BrandMark } from './BrandMark.jsx';
import { UserMenu } from './UserMenu.jsx';
import { AppFooter } from './AppFooter.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { IconButton } from '../ui/Button.jsx';
import { peticionesApi } from '../../services/api.js';
import { useCambios } from '../../utils/events.js';

function SkipLink() {
  return (
    <a className="skip-link" href="#contenido">
      Saltar al contenido
    </a>
  );
}

/* ======================= Estudiante ======================= */

const navEstudiante = [
  { to: '/estudiante', end: true, label: 'Explorar objetos', icon: ScanSearch },
  { to: '/estudiante/solicitudes', label: 'Mis solicitudes', icon: ClipboardList },
];

export function StudentLayout() {
  return (
    <div className="shell shell--student">
      <SkipLink />
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/estudiante" className="topbar__brand" aria-label="Ir al inicio">
            <BrandMark />
          </Link>
          <nav className="topnav" aria-label="Principal">
            {navEstudiante.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className="topnav__link">
                <Icon aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <UserMenu />
        </div>
      </header>

      <main id="contenido" className="shell__main" tabIndex={-1}>
        <Outlet />
      </main>
      <AppFooter />

      <nav className="bottomnav" aria-label="Principal (móvil)">
        {navEstudiante.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className="bottomnav__link">
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/* ======================= Administrador ======================= */

function usePendientes() {
  const [n, setN] = useState(null);
  const cargar = useCallback(() => {
    peticionesApi
      .listar()
      .then((ps) => setN(ps.filter((p) => p.estado === 'PENDIENTE').length))
      .catch(() => setN(null));
  }, []);
  useEffect(cargar, [cargar]);
  useCambios(cargar);
  return n;
}

function AdminNav({ pendientes, onNavigate }) {
  const items = [
    { to: '/admin', end: true, label: 'Objetos perdidos', icon: PackageSearch },
    { to: '/admin/objetos/nuevo', label: 'Dar de alta objeto', icon: PackagePlus },
    { to: '/admin/peticiones', label: 'Peticiones de estudiantes', icon: Inbox, badge: pendientes },
    { to: '/admin/historial', label: 'Historial', icon: History },
  ];
  return (
    <nav className="sidenav" aria-label="Funciones del administrador">
      <p className="sidenav__title">Gestión</p>
      <ul>
        {items.map(({ to, end, label, icon: Icon, badge }) => (
          <li key={to}>
            <NavLink to={to} end={end} className="sidenav__link" onClick={onNavigate}>
              <Icon aria-hidden="true" />
              <span className="sidenav__label">{label}</span>
              {badge > 0 && (
                <span className="sidenav__badge" aria-label={`${badge} pendientes`}>
                  {badge}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pendientes = usePendientes();
  return (
    <div className="shell shell--admin">
      <SkipLink />
      <header className="topbar topbar--admin">
        <div className="topbar__inner topbar__inner--wide">
          <IconButton className="topbar__menu" icon={Menu} label="Abrir menú de funciones" aria-expanded={menuAbierto} onClick={() => setMenuAbierto(true)} />
          <Link to="/admin" className="topbar__brand" aria-label="Ir al panel de objetos">
            <BrandMark />
          </Link>
          <span className="topbar__tag">Panel administrativo</span>
          <UserMenu />
        </div>
      </header>

      <div className="admin-body">
        <aside className="sidebar">
          <AdminNav pendientes={pendientes} />
          <div className="sidebar__help">
            <p className="sidebar__help-title">Recuerda</p>
            <p>No publiques nombres, números ni datos personales en fotos o descripciones.</p>
          </div>
        </aside>

        <div className="admin-main">
          <main id="contenido" className="shell__main shell__main--admin" tabIndex={-1}>
            <Outlet />
          </main>
          <AppFooter />
        </div>
      </div>

      <Dialog open={menuAbierto} onClose={() => setMenuAbierto(false)} variant="sheet" className="dialog--left" title="Menú">
        <AdminNav pendientes={pendientes} onNavigate={() => setMenuAbierto(false)} />
      </Dialog>
    </div>
  );
}
