#!/bin/bash
# Instala el script de Nautilus "Subir a hosted.inled.es" en el menú contextual.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"

DEST_DIR="$HOME/.local/share/nautilus/scripts"
mkdir -p "$DEST_DIR"

DEST="$DEST_DIR/Subir a hosted.inled.es"

sed "s#@REPO_DIR@#$REPO_DIR#g" "$SCRIPT_DIR/nautilus-upload-hosted.sh" > "$DEST"
chmod +x "$DEST"

echo "------------------------------------------------------------"
echo " Instalado: $DEST"
echo " Repositorio: $REPO_DIR"
echo "------------------------------------------------------------"
echo ""
echo "Requisitos en el equipo:"
echo "  - zenity, node, git"
echo "  - GITHUB_TOKEN exportado, o gh auth login (gh auth token)"
echo ""
echo "Luego abre Nautilus, haz clic derecho sobre un archivo y elige:"
echo "  Scripts > Subir a hosted.inled.es"
echo ""
echo "Si no aparece la opción, reinicia Nautilus:  nautilus -q"
