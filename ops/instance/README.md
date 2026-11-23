# ops/instance — Capa de personalización de la instancia en producción

Registro versionado de **cómo la instancia pública de Larixy se construye hoy**
sobre las imágenes oficiales de Fluxer. Hasta el 2026-11-23 esto vivía solo en
el VPS (`~/apps/wave-instance/` + scripts sueltos en el home de `deploy`), sin
control de versiones. Esta carpeta es su espejo en el repo: si el VPS se
pierde, la capa se puede reconstruir desde aquí.

> Esto **no** es el despliegue recomendado para self-hosters. Es la foto fiel
> del despliegue real de larixy.xyz, incluyendo sus parches históricos.

## Cómo encaja todo

1. **rexctl** genera el compose base (`.rexctl/generated/`) con las imágenes
   oficiales `ghcr.io/fluxerapp/*` fijadas por digest.
2. **`custom.compose.yml`** (este repo) se aplica encima y personaliza:
   - `edge`: sirve la landing propia desde `extra/landing/`
   - `admin`: usa la imagen propia `wave-admin:es`
   - `api`: monta 4 archivos dist ya parcheados desde `extra/` sobre
     `/usr/src/app/fluxer_api/dist/` y fija `FLUXER_APP_PRODUCT_NAME: "Larixy"`
   - `static-proxy`: monta `extra/web_icons/` y el logo propio sobre el logo
     de Fluxer
   - `app-proxy`: usa la imagen propia `wave-app-proxy:larixy`
3. **`Dockerfile`** (este repo) construye `wave-app-proxy:larixy`: la imagen
   upstream del app-proxy + `COPY extra/app_static/`, es decir, los bundles
   web **ya parcheados** por los scripts de `patches/`.
4. La imagen `wave-admin:es` (admin en español) **todavía no tiene su build
   aquí**: se creó el 2026-11-18, probablemente desde `fluxer_admin`, y su
   Dockerfile no estaba en la instancia. Pendiente de rescatar.

## Configuración de instancia (sin secretos)

Guardada en la base de datos de la instancia (`fluxer_kv`), no en archivos:

- Nombre de producto: `Larixy` (variable en el compose, arriba)
- Identidad de cuentas: modo `email`, sin estilo de tag
- Correo transaccional: SMTP vía **Resend**, remitente `noreply@larixy.xyz`,
  respuesta a `support@larixy.xyz`. **La clave vive solo en la configuración
  de la instancia.** Nunca debe aparecer en scripts ni en este repo: el
  2026-11-23 se rotó precisamente porque estaba escrita en scripts sueltos,
  que fueron eliminados tras la rotación.

## patches/ — qué hace cada script (registro histórico)

Todos editan **artefactos compilados** dentro de `extra/`, nunca código
fuente. Se conservan como registro de los cambios de comportamiento que la
instancia tiene y el código upstream no:

| Script | Cambio |
|---|---|
| `vps_patch_domain.py` | `fluxer-verification` → `larixy-verification` y `_fluxer.` → `_larixy.` en bundles de app y API |
| `patch_connection_modal.py` | Lo mismo en el asset del modal de conexión + registra su montaje en el compose |
| `replace_all_app_static.py` | Reemplazo masivo `_fluxer` → `_larixy` en todo `app_static`. Nota: tal como quedó guardado, construye el comando pero no lo ejecuta |
| `fix_partner_badge_href.py` | Corrige el enlace `marketing("partners")` → `marketing("partner")` en un chunk de la API |
| `patch_vps_api.py` | La API acepta el esquema `larixy://` además de `fluxer://` en el handoff de escritorio, y añade el origen CORS `larixy-app://app` |
| `find_fluxer.py`, `read_state.py`, `test_resend_port.py` | Diagnóstico (buscar restos `fluxer`, leer estado de rexctl, probar puertos SMTP). Sin cambios |
| `extra/inject_into_index.py` + `extra/premium_style_tag.html` | Inyecta la etiqueta de estilo `larixy-modern-premium` en el `index.html` de la app servida |

## Riesgos conocidos de esta capa

- Los montajes de la API apuntan a nombres de archivo con hash de una build
  concreta de Fluxer: al actualizar las imágenes upstream, los parches dejan
  de aplicar **en silencio**. Antes de actualizar, revisar esta carpeta.
- Los cambios de comportamiento listados arriba deberían migrar al código
  fuente (`larixy_app` / `larixy_api`) cuando la instancia corra imágenes
  construidas desde este repo. Hasta entonces, esta carpeta es la única
  verdad sobre ellos.
- `extra/` en el servidor acumula copias `.bak_*` de cada ciclo; podar con
  cuidado y conservar siempre la última.
