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

1. Levanta la API ([gestionObjetosPerdidos-api](https://github.com/VectorGarMan/gestionObjetosPerdidos-api)); queda en `http://localhost:8080`.
2. Copia `.env.example` a `.env` (ya trae `VITE_API_URL=http://localhost:8080`) y ejecuta `npm run dev`.
   El cliente corre en `http://localhost:5173`, que la API ya permite por CORS.
3. Entra con un correo de la base de la API: `laura.mendez@univa.mx` o `jorge.salas@univa.mx` (administradores);
   `ana.torres@alumnos.univa.mx`, `luis.ramirez@alumnos.univa.mx`, `maria.ibarra@alumnos.univa.mx` o
   `carlos.nunez@alumnos.univa.mx` (estudiantes).

Con `VITE_API_URL` definida, la app usa `src/services/api.http.js`; sin ella usa `src/services/api.mock.js`.
Ambas devuelven los datos con la misma forma, así que las pantallas no cambian.

Qué hace `api.http.js` para hablar con la API:

- **Token JWT:** guarda el `token` de `POST /api/usuarios/identificacion` y lo envía como `Authorization: Bearer`.
  Si la API responde 401, la sesión se cierra y se vuelve al inicio.
- **Forma de los datos:** convierte los objetos anidados de la API (`tipoObjeto`, `color`, `modulo`,
  `otrasEtiquetas`, `rutaImagen`) en los campos planos de la UI (`tipoObjetoId`, `colorId`, `moduloId`,
  `otrasEtiquetaIds`, `fotografiaUrl`), y `codigoHex` / `horarioAtencion` en `hex` / `horario`.
- **Errores:** lee `mensaje` y `campos` de la API y les asigna los códigos que usa la UI
  (`NO_ENCONTRADO`, `SIN_ROL`, `PETICION_DUPLICADA`, `OBJETO_CAMBIO_ESTADO`, `PETICION_LIBERADA`…).
- **Fotografía:** el formulario envía la imagen como archivo en `multipart/form-data`; en la edición, solo si cambió.

Lo que la API no ofrece y se resuelve en el cliente:

- **Folio:** se calcula a partir del id (`OP-0101`, `PT-0201`).
- **Búsqueda por texto y filtro por módulo:** se aplican sobre la lista que devuelve la API.
- **Detalle del administrador:** las peticiones de un objeto y a quién se entregó se obtienen de `/api/peticiones`.
  La lista de peticiones pide el detalle de cada una (correo, objeto y quién liberó): una llamada por petición.
- **Mis solicitudes (estudiante):** la API solo deja listar peticiones al administrador, así que el estudiante ve
  las que creó desde ese navegador, y su estado no cambia cuando el administrador las libera. Para tenerlo completo,
  la API necesitaría un endpoint como `GET /api/peticiones/mias`.
- **Programa del estudiante:** la API no lo tiene; esa línea se oculta.

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
