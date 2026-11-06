#!/bin/bash
# ----------------------------------------------------------------------------
# Script de Nautilus: subir el archivo seleccionado a hosted.inled.es
# Se instala en ~/.local/share/nautilus/scripts/ y aparece en el menú
# contextual (clic derecho) como "Scripts > Subir a hosted.inled.es".
#
# Requisitos: zenity, node, git, y GITHUB_TOKEN exportado o `gh auth login`.
#
# Instalación: bash scripts/install-nautilus-extension.sh
# ----------------------------------------------------------------------------
set -u

LOGFLAG="/tmp/nautilus-hosted-upload.log"
log() { echo "[$(date '+%F %T')] $*" >> "$LOGFLAG"; }

log "=== Inicio script nautilus ==="
log "Argumentos recibidos ($#): $*"
log "NAUTILUS_SCRIPT_SELECTED_FILE_PATHS=[${NAUTILUS_SCRIPT_SELECTED_FILE_PATHS:-<vacio>}]"
log "DISPLAY=${DISPLAY:-<vacio>}"

export DISPLAY="${DISPLAY:-:1}"
export XDG_SESSION_TYPE="${XDG_SESSION_TYPE:-wayland}"

REPO_DIR="@REPO_DIR@"
SCRIPT="$REPO_DIR/scripts/upload-asset.js"

# --- Buscar node (PATH del usuario, luego nvm, luego rutas habituales) ---
NODE_BIN=""
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  for cand in "$HOME"/.nvm/versions/node/*/bin/node /usr/local/bin/node /usr/bin/node; do
    [ -x "$cand" ] && NODE_BIN="$cand"
  done
fi
[ -z "$NODE_BIN" ] && { zenity --error --text="No se encontró node. Instálalo o revisa tu PATH." 2>/dev/null; log "Falta node"; exit 1; }
export PATH="$(dirname "$NODE_BIN"):$PATH"
log "Usando node: $NODE_BIN ($($NODE_BIN --version 2>&1))"

command -v zenity >/dev/null 2>&1 || { log "Falta zenity"; exit 1; }
[ -f "$SCRIPT" ] || { zenity --error --text="No se encontró el subidor: $SCRIPT"; log "Falta $SCRIPT"; exit 1; }
[ -d "$REPO_DIR" ] || { zenity --error --text="No se encuentra el repositorio: $REPO_DIR"; log "Falta $REPO_DIR"; exit 1; }

# --- Escapa caracteres XML para que zenity no falle con marcado Pango ---
zenity_escape() {
  local s="$1"
  s="${s//&/&amp;}"
  s="${s//</&lt;}"
  s="${s//>/&gt;}"
  s="${s//\"/&quot;}"
  s="${s//\'/&#39;}"
  printf '%s' "$s"
}

# --- Obtener token de GitHub (preguntar si falta) ---
TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  TOKEN="$(gh auth token 2>/dev/null || true)"
fi
if [ -z "$TOKEN" ]; then
  log "Pidiendo token por zenity..."
  TOKEN="$(zenity --entry --title="Subir a hosted.inled.es" \
    --text="Introduce tu token de GitHub (con permisos sobre el repo):" \
    --entry-text="" 2>/dev/null)" || true
fi
if [ -z "$TOKEN" ]; then
  zenity --error --title="Subir a hosted.inled.es" \
    --text="Se requiere un token de GitHub para subir el archivo."
  log "FALTA TOKEN (cancelado por usuario)"
  exit 1
fi
export GITHUB_TOKEN="$TOKEN"
log "Token OK"

# --- Recopilar archivos seleccionados ---
FILES=()
if [ -n "${NAUTILUS_SCRIPT_SELECTED_FILE_PATHS:-}" ]; then
  while IFS= read -r line; do
    [ -n "$line" ] && FILES+=("$line")
  done <<< "${NAUTILUS_SCRIPT_SELECTED_FILE_PATHS}"
fi
if [ ${#FILES[@]} -eq 0 ] && [ $# -gt 0 ]; then
  FILES=("$@")
fi

log "Archivos para subir (${#FILES[@]}): ${FILES[*]}"

[ ${#FILES[@]} -gt 0 ] || { zenity --error --text="No seleccionaste ningún archivo."; exit 1; }

cd "$REPO_DIR" || { zenity --error --text="No se puede acceder a $REPO_DIR"; exit 1; }
log "Directorio de trabajo: $(pwd)"

for FILE in "${FILES[@]}"; do
  log "Procesando: $FILE"
  [ -f "$FILE" ] || { log "No es un archivo válido, saltando: $FILE"; continue; }

  BASENAME="$(basename "$FILE")"
  SIZE="$(stat -c %s "$FILE" 2>/dev/null || echo 0)"
  if [ "$SIZE" -gt 2147483648 ]; then
    zenity --error --text="$BASENAME supera el límite de 2 GB."
    continue
  fi

  # Pedir nombre del asset
  log "Abriendo zenity entry para nombre del asset..."
  NEWNAME="$(zenity --entry --title="Subir a hosted.inled.es" \
    --text="Nombre del asset para:" \
    --entry-text="$BASENAME" 2>/dev/null)"
  RC=$?
  log "Zenity entry RC=$RC, NEWNAME='$NEWNAME'"
  [ $RC -ne 0 ] && continue
  [ -z "$NEWNAME" ] && NEWNAME="$BASENAME"
  case "$NEWNAME" in
    *.* ) ;;
    * ) zenity --error --text="El nombre debe incluir extensión (p. ej. foto.png)."; continue ;;
  esac

  log "Subiendo $FILE como $NEWNAME"

  TMPLOG="$(mktemp /tmp/nautilus-upload.XXXXXX)"
  TMPERR="$(mktemp /tmp/nautilus-upload-err.XXXXXX)"

  # Subida en segundo plano; --progress emite PROGRESS/RESULT/HOST por stdout
  "$NODE_BIN" "$SCRIPT" "$FILE" --name "$NEWNAME" --progress >"$TMPLOG" 2>"$TMPERR" &
  NODE_PID=$!
  log "PID node: $NODE_PID"

  # Barra de progreso con zenity. El bucle termina cuando node acaba
  # (no cuando el log deja de crecer: antes eso dejaba la ventana colgada).
  (
    LAST_PCT=""
    while kill -0 "$NODE_PID" 2>/dev/null; do
      PCT="$(grep -a '^PROGRESS ' "$TMPLOG" 2>/dev/null | tail -1 | cut -d' ' -f2)"
      if [ -n "$PCT" ] && [ "$PCT" != "$LAST_PCT" ]; then
        LAST_PCT="$PCT"
        echo "$PCT"
      fi
      sleep 0.3
    done
    PCT="$(grep -a '^PROGRESS ' "$TMPLOG" 2>/dev/null | tail -1 | cut -d' ' -f2)"
    [ -n "$PCT" ] && [ "$PCT" != "$LAST_PCT" ] && echo "$PCT"
    echo "100"
  ) | zenity --progress --title="Subiendo a hosted.inled.es" \
      --text="$(zenity_escape "$NEWNAME")" \
      --percentage=0 --width=450 --auto-close --no-cancel

  wait "$NODE_PID"
  STATUS=$?
  log "Estado de subida: $STATUS"

  if [ $STATUS -ne 0 ]; then
    # Construir mensaje de error con todo lo disponible
    ERRMSG="$(cat "$TMPERR" 2>/dev/null)"
    OUTMSG="$(cat "$TMPLOG" 2>/dev/null)"
    if [ -z "$ERRMSG" ]; then
      ERRMSG="$OUTMSG"
    fi
    if [ -z "$ERRMSG" ]; then
      ERRMSG="Error desconocido (sin salida de error). Revisa /tmp/nautilus-hosted-upload.log"
    fi
    # Truncar si es muy largo
    ERRMSG="$(echo "$ERRMSG" | head -c 2000)"
    # Escapar para zenity (evita fallos de marcado Pango con emojis, <, >, &)
    ERRMSG_ESC="$(zenity_escape "$ERRMSG")"
    zenity --error --title="Error subiendo $NEWNAME" --text="$ERRMSG_ESC"
    log "ERROR subiendo $NEWNAME:"
    log "$ERRMSG"
    continue
  fi

  GHURL="$(grep -a '^RESULT ' "$TMPLOG" | tail -1 | sed 's/^RESULT //')"
  HOST="$(grep -a '^HOST ' "$TMPLOG" | tail -1 | sed 's/^HOST //')"

  zenity --info --title="Subida completada" --text="Archivo: $(zenity_escape "$NEWNAME")

GitHub:
$(zenity_escape "$GHURL")

Host (hosted.inled.es):
$(zenity_escape "$HOST")

Puedes usar la Host URL en tus sitios y apps."
  rm -f "$TMPLOG" "$TMPERR"
  log "OK: $NEWNAME -> $HOST"
done

log "=== Fin script nautilus ==="
