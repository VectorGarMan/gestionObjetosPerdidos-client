import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/layout/BrandMark.jsx';
import { AppFooter } from '../../components/layout/AppFooter.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';

const DOCUMENTOS = {
  privacidad: {
    titulo: 'Aviso de Privacidad',
    resumen: 'Cómo usa la plataforma Objetos Perdidos los datos personales que obtiene de la base de datos de la universidad.',
    secciones: [
      ['¿Qué datos se tratan?', 'A partir de tu correo institucional, la plataforma consulta tu nombre, matrícula y rol. Cuando envías una petición, se registra tu matrícula junto con el objeto y la fecha. Las fotografías y descripciones de los objetos no deben contener datos personales.'],
      ['¿Para qué se usan?', 'Únicamente para identificarte, mostrarte la pantalla que corresponde a tu rol y permitir que el personal administrador gestione la entrega de objetos o el seguimiento de un reclamo de error.'],
      ['¿Quién puede verlos?', 'Solo el personal administrador de los módulos de resguardo. En un reclamo de error, los datos de contacto de quien reclamó antes el objeto se muestran exclusivamente al administrador, nunca al estudiante que reporta.'],
      ['Tus derechos', 'Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos (derechos ARCO) conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, a través de los canales oficiales de la universidad.'],
    ],
  },
  terminos: {
    titulo: 'Términos y Condiciones',
    resumen: 'Reglas de uso de la plataforma Objetos Perdidos para estudiantes y personal administrador.',
    secciones: [
      ['Uso permitido', 'La plataforma sirve para consultar y reclamar únicamente objetos propios, y para reportar cuando un objeto propio fue reclamado por error por otra persona.'],
      ['Reclamos de buena fe', 'Reclamar un objeto ajeno o hacerlo con mala intención puede considerarse una falta conforme a la normativa de la institución. Al recoger un objeto, el personal puede pedirte tu credencial y un rasgo que solo el dueño conozca.'],
      ['Reclamos de error', 'Cuando reportas un reclamo de error, el personal administrador revisa el caso y, si es necesario, contacta a la persona que recibió el objeto. Tú no recibirás sus datos personales.'],
      ['Personal administrador', 'El personal se compromete a no publicar datos personales en fotografías o descripciones y a usar los datos de contacto solo para resolver cada caso, sin compartirlos con terceros.'],
    ],
  },
};

export function LegalPage({ doc }) {
  const d = DOCUMENTOS[doc];
  return (
    <div className="legal">
      <header className="legal__top">
        <Link to="/" aria-label="Ir al inicio">
          <BrandMark />
        </Link>
      </header>
      <main id="contenido" className="legal__main page-enter">
        <p className="page-head__eyebrow">Información legal</p>
        <h1 className="legal__title">{d.titulo}</h1>
        <p className="legal__lede">{d.resumen}</p>
        <Alert tone="info" className="legal__notice">
          Texto de referencia del prototipo, basado en la especificación del sistema. La versión oficial debe proporcionarla el área jurídica de la universidad.
        </Alert>
        {d.secciones.map(([t, txt], i) => (
          <section key={t} className="legal__section">
            <h2>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span> {t}
            </h2>
            <p>{txt}</p>
          </section>
        ))}
      </main>
      <AppFooter />
    </div>
  );
}
