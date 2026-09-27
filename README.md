# hosted.inled.es

CDN público de InledGroup sobre GitHub Releases. Los archivos (imágenes, GIFs, vídeos…) se suben como *assets* de la release `assets` y se sirven a través de `https://hosted.inled.es/cdn/<nombre>`.

## Subir archivos

Usa el script de subida:

```bash
# Desde la raíz del repo (abre el selector de archivos del sistema)
node scripts/upload-asset.js

# O con ruta directa
node scripts/upload-asset.js ruta/al/archivo.png

# Desde otra carpeta también funciona (p. ej. ./upload-asset.js dentro de scripts/)
```

El script hace todo el flujo automáticamente:

1. Abre un selector de archivos nativo (zenity/kdialog/qarma/matedialog/yad) o pide la ruta por consola si no hay entorno gráfico.
2. Sube el archivo como asset de la release `assets` del repo (crea releases nuevas `assets-2`, `assets-3`… al llegar a 1000 assets).
3. Si ya existe un asset con el mismo nombre, lo reemplaza (♻️).
4. Regenera el índice (`public/release-assets.json` y `src/data/release-assets.json`).
5. Hace commit y push del índice.

Al terminar imprime las URLs del archivo:

```
GitHub URL: https://github.com/InledGroup/hosted.inled.es/releases/download/assets/openrouter-logo.svg
Host URL:   https://hosted.inled.es/cdn/openrouter-logo.svg
```

> **Nota:** usa siempre la `Host URL` (`https://hosted.inled.es/cdn/...`) para referenciar el archivo desde webs o apps.

### Opciones

| Flag | Descripción |
|---|---|
| `--name nombre.ext` | Nombre con el que se sube el asset (debe incluir extensión). Por defecto, el nombre del archivo. Los espacios se convierten en `-`. |
| `--repo owner/repo` | Repo destino. Por defecto `InledGroup/hosted.inled.es`. |
| `--no-push` | Regenera el índice pero no hace commit ni push. |

### Autenticación

El script necesita un token de GitHub (con permisos sobre el repo) en este orden:

1. Variable de entorno `GITHUB_TOKEN`
2. El token de la CLI `gh` (`gh auth login`)

### Límites

- Tamaño máximo por archivo: **2 GB** (límite de GitHub Releases).
- Nombres sin espacios (se sustituyen por guiones) y con extensión.

### Regenerar solo el índice

Si por cualquier motivo necesitas reconstruir el índice de assets sin subir nada:

```bash
node scripts/generate-assets-index.js
```
