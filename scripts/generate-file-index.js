import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const outputFile = path.join(__dirname, '../src/data/file-index.json');

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
      const relativePath = path.join(basePath, item.name);

      if (item.isDirectory()) {
        allItems.push({
          name: item.name,
          type: 'folder',
          path: relativePath
        });
        allItems = allItems.concat(getAllFilesRecursive(fullPath, relativePath));
      } else {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(item.name).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext);

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

// Create data directory if it doesn't exist
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write file index
fs.writeFileSync(outputFile, JSON.stringify(fileIndex, null, 2));

console.log(`✅ Generated file index with ${fileIndex.length} items`);
console.log(`📝 Output: ${outputFile}`);
