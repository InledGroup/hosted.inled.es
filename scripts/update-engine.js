import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'node:url';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Argumentos
const zipPath = process.argv[2];

if (!zipPath) {
  console.error('\x1b[31mError: Debes proporcionar la ruta al archivo Hostify.zip\x1b[0m');
  console.log('Uso: node scripts/update-engine.js <ruta_al_zip>');
  process.exit(1);
}

if (!fs.existsSync(zipPath)) {
  console.error(`\x1b[31mError: El archivo no existe: ${zipPath}\x1b[0m`);
  process.exit(1);
}

// Carpetas y archivos a IGNORAR durante la actualización
const IGNORE_LIST = [
  'node_modules',
  '.git',
  '.github',
  '.env',
  'public', // Importante: Aquí están tus imágenes
  'scripts', // El script de actualización no debe sobrescribirse a sí mismo
  '.hostify_update_temp'
];

async function updateHostify() {
  console.log(`\x1b[36m🚀 Iniciando actualización de Hostify desde: ${zipPath}...\x1b[0m`);

  try {
    const zip = new AdmZip(zipPath);
    const tempDir = path.join(rootDir, '.hostify_update_temp');

    // 1. Limpiar y crear carpeta temporal
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir);

    console.log('📦 Extrayendo archivos...');
    zip.extractAllTo(tempDir, true);

    // 2. Detectar si el zip tiene una subcarpeta (típico de GitHub)
    let sourceDir = tempDir;
    const contents = fs.readdirSync(tempDir);
    if (contents.length === 1 && fs.statSync(path.join(tempDir, contents[0])).isDirectory()) {
      sourceDir = path.join(tempDir, contents[0]);
      console.log(`📂 Detectada subcarpeta: ${contents[0]}`);
    }

    // 3. Reemplazar archivos uno a uno
    const items = fs.readdirSync(sourceDir);
    let updatedCount = 0;

    for (const item of items) {
      if (IGNORE_LIST.includes(item)) {
        console.log(`\x1b[33m⏭️ Ignorando: ${item}\x1b[0m`);
        continue;
      }

      const srcPath = path.join(sourceDir, item);
      const destPath = path.join(rootDir, item);

      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }

      fs.cpSync(srcPath, destPath, { recursive: true });
      updatedCount++;
      console.log(`✅ Actualizado: ${item}`);
    }

    // 4. Limpiar temporal
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log('\n\x1b[32m✨ ¡Actualización completada con éxito!\x1b[0m');
    console.log(`Se han actualizado ${updatedCount} elementos del motor.`);
    console.log('\x1b[33m⚠️ Recuerda ejecutar "npm install" si el package.json ha cambiado.\x1b[0m');

  } catch (error) {
    console.error('\x1b[31m❌ Error crítico durante la actualización:\x1b[0m', error.message);
    process.exit(1);
  }
}

updateHostify();
