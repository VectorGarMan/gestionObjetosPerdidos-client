# Objetos Perdidos · UNIVA (frontend)

Prototipo funcional del sistema de objetos perdidos y encontrados de la Universidad del Valle de Atemajac.
Implementa las nueve pantallas (PNT-01 a PNT-09) y los cinco formularios (F-01 a F-05) de la especificación
*Proyecto Primer Parcial – Calidad de Software*, más una vista de seguimiento para el estudiante.

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # compilación de producción en dist/
npm run lint
```

### Cuentas de demostración

| Correo | Rol |
| --- | --- |
| `ana.ramirez@univa.mx` | Estudiante |
| `luis.gomez@univa.mx`, `mariana.lopez@univa.mx`, `diego.perez@univa.mx` | Estudiante |
| `laura.sanchez@univa.mx`, `jorge.martinez@univa.mx` | Administrador |
| `visitante@univa.mx` | Sin rol (muestra el error de acceso) |

Los cambios se guardan en `localStorage` del navegador. Desde el menú de usuario se pueden
**restablecer los datos de demostración**.

## Conectar con el backend (Spring Boot)

Copia `.env.example` a `.env` y define `VITE_API_URL` (por ejemplo `http://localhost:8080`).
Con la variable definida, la app usa `src/services/api.http.js`, que llama a los endpoints de la sección 5.1;
sin ella usa `src/services/api.mock.js`. Ambas implementaciones tienen las mismas firmas y códigos de error
(`NO_ENCONTRADO`, `SIN_ROL`, `PETICION_DUPLICADA`, `OBJETO_CAMBIO_ESTADO`, `PETICION_LIBERADA`), así que la UI no cambia.

> El backend debe filtrar por rol los datos sensibles: el detalle del objeto para estudiantes no debe incluir
> a quien lo reclamó, y `contacto-previo` solo debe responder a administradores.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | PNT-01 Identificación por correo |
| `/confirmar` | PNT-02 Confirmación de datos |
| `/estudiante` | PNT-03 Consulta (filtros en la URL) |
| `/estudiante/objetos/:id` | PNT-04 Detalle, reclamar / reclamar error |
| `/estudiante/solicitudes` | Seguimiento de peticiones del estudiante |
| `/admin` | PNT-05 Objetos perdidos |
| `/admin/objetos/:id` | PNT-06 Detalle, editar / eliminar |
| `/admin/objetos/nuevo`, `/admin/objetos/:id/editar` | PNT-07 Alta y edición |
| `/admin/peticiones` | PNT-08 Peticiones (`?matricula=`, `?id=` abre el detalle) |
| `/admin/historial`, `/admin/historial/:id` | PNT-09 Historial (solo lectura) |
| `/aviso-de-privacidad`, `/terminos-y-condiciones` | Textos legales de referencia |

## Estructura

```
src/
  components/
    ui/          Button, Field, Select, MultiSelect, Segmented, Dialog, ConfirmProvider, Feedback
    layout/      Layouts (estudiante / administrador), BrandMark, UserMenu, AppFooter
    objetos/     ObjetoCard, ObjetoThumb, ObjetoDetalle, FilterBar, ImageDrop
    peticiones/  PeticionDetalle, PeticionBadges
  context/       Sesión (dos pasos) y catálogos compartidos
  data/          Catálogos y datos de demostración
  hooks/         useAsync, useFiltros (filtros sincronizados con la URL)
  pages/         auth, estudiante, admin, legal
  services/      api.js (selector), api.mock.js, api.http.js, mockDb.js, http.js
  styles/        tokens.css (sistema de diseño), base.css
  utils/         validación, formato de fechas, imágenes, eventos
```

## Identidad visual

- Azul institucional `#002758` (barra de navegación de univa.mx) y naranja `#F18903` (Pantone 144 C)
  como acento; azul `#005EB8` (Pantone 300 C) para enlaces e información.
- Tipografía Figtree, sustituto libre cercano a Avenir, la tipografía institucional.
- El logotipo se carga desde el sitio oficial (`src/utils/brand.js`). Para producción, pide el archivo
  vectorial a Comunicación Institucional y colócalo en `public/brand/`.
- Los objetos de demostración no tienen foto: se muestran con una ilustración generada a partir de su tipo y color.
  Las fotos que sube el administrador sustituyen esa ilustración.
