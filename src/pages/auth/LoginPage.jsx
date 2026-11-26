import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { AuthLayout } from './AuthLayout.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { rutaInicio, useSession } from '../../context/SessionContext.jsx';
import { MODO_DEMO, usuariosApi } from '../../services/api.js';
import { validarCorreo } from '../../utils/validators.js';

const cuentasDemo = [
  { correo: 'ana.ramirez@univa.mx', etiqueta: 'Estudiante' },
  { correo: 'laura.sanchez@univa.mx', etiqueta: 'Administradora' },
  { correo: 'visitante@univa.mx', etiqueta: 'Sin rol' },
];

/** PNT-01 · Inicio de sesión 1: identificación por correo (F-01). */
export function LoginPage() {
  const { usuario, setPendiente } = useSession();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [errorServidor, setErrorServidor] = useState(null);
  const [tocado, setTocado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  if (usuario) return <Navigate to={rutaInicio(usuario.rol)} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;
    const msg = validarCorreo(correo);
    setTocado(true);
    setError(msg);
    setErrorServidor(null);
    if (msg) {
      input.current?.focus();
      return;
    }
    setCargando(true);
    try {
      const u = await usuariosApi.identificar(correo.trim());
      setPendiente(u);
      navigate('/confirmar');
    } catch (err) {
      setErrorServidor(err);
      setCargando(false);
    }
  };

  return (
    <AuthLayout>
      <header className="auth__card-head">
        <h2 className="auth__title">Bienvenido</h2>
        <p className="auth__subtitle">Ingresa con tu correo institucional. Detectaremos si eres estudiante o administrador.</p>
      </header>

      <form onSubmit={enviar} noValidate className="auth__form">
        {errorServidor && (
          <Alert tone="danger" title={errorServidor.code === 'SIN_ROL' ? 'Cuenta sin acceso' : 'No pudimos identificarte'}>
            {errorServidor.message}
          </Alert>
        )}

        <Field label="Correo" required error={tocado ? error : ''} hint="Ejemplo: nombre.apellido@univa.mx">
          {(a11y) => (
            <div className="input-icon">
              <Mail aria-hidden="true" />
              <input
                ref={input}
                {...a11y}
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck="false"
                maxLength={100}
                className="control control--lg"
                placeholder="nombre@univa.mx"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value.replace(/\s/g, ''));
                  if (tocado) setError(validarCorreo(e.target.value));
                  setErrorServidor(null);
                }}
                onBlur={() => {
                  if (correo) {
                    setTocado(true);
                    setError(validarCorreo(correo));
                  }
                }}
              />
            </div>
          )}
        </Field>

        <Button type="submit" size="lg" block loading={cargando} iconRight={ArrowRight}>
          {cargando ? 'Verificando…' : 'Continuar'}
        </Button>
      </form>

      {MODO_DEMO && (
        <div className="demo-accounts">
          <p className="demo-accounts__title">Cuentas de demostración</p>
          <ul>
            {cuentasDemo.map((c) => (
              <li key={c.correo}>
                <button
                  type="button"
                  className="demo-accounts__btn"
                  onClick={() => {
                    setCorreo(c.correo);
                    setError('');
                    setErrorServidor(null);
                    input.current?.focus();
                  }}
                >
                  <span className="mono">{c.correo}</span>
                  <span className="demo-accounts__tag">{c.etiqueta}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthLayout>
  );
}
