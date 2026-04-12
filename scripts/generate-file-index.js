import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public/1');
const outputFile = path.join(__dirname, '../src/data/file-index.json');
const redirectsFile = path.join(__dirname, '../public/_redirects');

function getAllFilesRecursive(dirPath, basePath = '') {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist. Creating empty index.`);
      return [];
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    let allItems = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      // NORMALIZACIÓN: Forzamos el uso de '/' para las rutas del índice, sin importar el SO
      const relativePath = path.join(basePath, item.name).split(path.sep).join('/');

      if (item.isDirectory()) {
        allItems.push({
          name: item.name,
          type: 'folder',
          path: relativePath
        });
        const subItems = getAllFilesRecursive(fullPath, relativePath);
        allItems = allItems.concat(subItems);
      } else {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(item.name).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext);

        allItems.push({
          name: item.name,
          type: 'file',
          path: relativePath,
          size: stats.size,
          isImage,
          extension: ext
        });
      }
    }

    return allItems;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// Generate file index
const fileIndex = getAllFilesRecursive(publicDir);

// Rutas de salida
const publicOutputFile = path.join(__dirname, '../public/file-index.json');
const srcOutputFile = path.join(__dirname, '../src/data/file-index.json');

// Asegurar directorios
[path.dirname(publicOutputFile), path.dirname(srcOutputFile)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Guardar en ambos sitios
const jsonContent = JSON.stringify(fileIndex, null, 2);
fs.writeFileSync(publicOutputFile, jsonContent);
fs.writeFileSync(srcOutputFile, jsonContent);

console.log(`✅ Index generated: ${fileIndex.length} items`);
console.log(`📍 Public: ${publicOutputFile}`);
console.log(`📍 Source: ${srcOutputFile}`);

// --- GENERAR _REDIRECTS CON REGLA MAESTRA (SPLAT) ---
// Esta configuración protege la infraestructura de la web y redirige todo lo demás a /1/
const redirectsContent = `# Cloudflare Pages Redirects - Master Splat Rule
# 1. Excepciones Críticas (Evitan que la web se rompa)
/              /index.html    200
/index.html    /index.html    200
/favicon.ico   /favicon.ico   200
/file-index.json /file-index.json 200
/api/*         /api/:splat    200
/_astro/*      /_astro/:splat 200
/1/*           /1/:splat      200

# 2. Regla Maestra (Todo lo que no coincida arriba, búscalo en /1/)
# Esto permite enlaces antiguos como /mi-imagen.png -> /1/mi-imagen.png
/*             /1/:splat      200
`;

// Escribir el archivo _redirects en la carpeta public
fs.writeFileSync(redirectsFile, redirectsContent);

console.log(`✅ Generated file index with ${fileIndex.length} items`);
console.log(`📝 Output: ${outputFile}`);
console.log(`🚀 Master Splat Rule applied to ${redirectsFile}`);
