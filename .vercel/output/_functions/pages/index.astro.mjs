import { e as createComponent, f as createAstro, r as renderTemplate, k as defineScriptVars, h as addAttribute, l as renderComponent, n as renderHead, o as Fragment } from '../chunks/astro/server_Dgzn42Zx.mjs';
import fs from 'fs';
import path from 'path';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const publicDir = path.join(process.cwd(), "public");
  function getDirectoryContents(dirPath) {
    try {
      const items2 = fs.readdirSync(dirPath, { withFileTypes: true });
      const folders = items2.filter((item) => item.isDirectory()).map((item) => ({
        name: item.name,
        type: "folder",
        path: path.relative(publicDir, path.join(dirPath, item.name))
      })).sort((a, b) => a.name.localeCompare(b.name));
      const files = items2.filter((item) => item.isFile()).map((item) => {
        const fullPath = path.join(dirPath, item.name);
        const stats = fs.statSync(fullPath);
        const ext = path.extname(item.name).toLowerCase();
        const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"].includes(ext);
        return {
          name: item.name,
          type: "file",
          path: path.relative(publicDir, fullPath),
          size: stats.size,
          isImage,
          extension: ext
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return [...folders, ...files];
    } catch (error) {
      return [];
    }
  }
  function getAllFilesRecursive(dirPath, basePath = "") {
    try {
      const items2 = fs.readdirSync(dirPath, { withFileTypes: true });
      let allItems2 = [];
      for (const item of items2) {
        const fullPath = path.join(dirPath, item.name);
        const relativePath = path.join(basePath, item.name);
        if (item.isDirectory()) {
          allItems2.push({
            name: item.name,
            type: "folder",
            path: relativePath
          });
          allItems2 = allItems2.concat(getAllFilesRecursive(fullPath, relativePath));
        } else {
          const stats = fs.statSync(fullPath);
          const ext = path.extname(item.name).toLowerCase();
          const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"].includes(ext);
          allItems2.push({
            name: item.name,
            type: "file",
            path: relativePath,
            size: stats.size,
            isImage,
            extension: ext
          });
        }
      }
      return allItems2;
    } catch (error) {
      return [];
    }
  }
  const currentPath = Astro2.url.searchParams.get("path") || "";
  const currentDir = path.join(publicDir, currentPath);
  const items = getDirectoryContents(currentDir);
  const allItems = getAllFilesRecursive(publicDir);
  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }
  return renderTemplate(_a || (_a = __template(['<html lang="es" data-astro-cid-j7pv25f6> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Explorador de Archivos - Public</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">', '</head> <body data-astro-cid-j7pv25f6> <div class="container" data-astro-cid-j7pv25f6> <div class="header" data-astro-cid-j7pv25f6> <h1 data-astro-cid-j7pv25f6><i class="fas fa-folder-open" data-astro-cid-j7pv25f6></i> Explorador de Archivos</h1> <div class="breadcrumb" data-astro-cid-j7pv25f6> <a href="/" data-astro-cid-j7pv25f6><i class="fas fa-home" data-astro-cid-j7pv25f6></i> Public</a> ', ' </div> </div> <div class="search-container" data-astro-cid-j7pv25f6> <div class="search-wrapper" data-astro-cid-j7pv25f6> <i class="fas fa-search" data-astro-cid-j7pv25f6></i> <input type="text" id="searchInput" class="search-input" placeholder="Buscar archivos y carpetas..." data-astro-cid-j7pv25f6> </div> </div> <div class="content" data-astro-cid-j7pv25f6> ', ' </div> </div> <div id="toast" class="toast" data-astro-cid-j7pv25f6></div> <script>(function(){', `
    function copyUrl(url) {
      const fullUrl = window.location.origin + url;
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('<i class="fas fa-check-circle"></i> URL copiada al portapapeles');
      }).catch(() => {
        showToast('<i class="fas fa-exclamation-circle"></i> Error al copiar la URL');
      });
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.innerHTML = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    const searchInput = document.getElementById('searchInput');
    const items = document.querySelectorAll('.item');

    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();

      if (searchTerm === '') {
        items.forEach(item => item.classList.remove('hidden'));
        return;
      }

      // Buscar en todos los archivos recursivamente
      const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.path.toLowerCase().includes(searchTerm)
      );

      items.forEach(item => {
        const itemName = item.getAttribute('data-name');
        if (itemName.includes(searchTerm)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });

    // Hacer la funci\xF3n copyUrl global
    window.copyUrl = copyUrl;
  })();<\/script> </body> </html>`])), renderHead(), currentPath && currentPath.split("/").map((part, index, arr) => {
    const pathUpTo = arr.slice(0, index + 1).join("/");
    return renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` <span class="separator" data-astro-cid-j7pv25f6><i class="fas fa-chevron-right" data-astro-cid-j7pv25f6></i></span> <a${addAttribute(`?path=${pathUpTo}`, "href")} data-astro-cid-j7pv25f6>${part}</a> ` })}`;
  }), items.length === 0 ? renderTemplate`<div class="empty-state" data-astro-cid-j7pv25f6> <i class="fas fa-inbox" data-astro-cid-j7pv25f6></i> <h2 data-astro-cid-j7pv25f6>No hay archivos aquí</h2> <p data-astro-cid-j7pv25f6>Esta carpeta está vacía</p> </div>` : renderTemplate`<div class="items-grid" id="itemsGrid" data-astro-cid-j7pv25f6> ${items.map((item) => renderTemplate`<div class="item"${addAttribute(item.name.toLowerCase(), "data-name")}${addAttribute(item.type, "data-type")} data-astro-cid-j7pv25f6> ${item.type === "folder" ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` <div class="item-preview" data-astro-cid-j7pv25f6> <i class="fas fa-folder folder-icon" data-astro-cid-j7pv25f6></i> </div> <div class="item-body" data-astro-cid-j7pv25f6> <div class="item-info" data-astro-cid-j7pv25f6> <div class="item-name" data-astro-cid-j7pv25f6>${item.name}</div> <div class="item-details" data-astro-cid-j7pv25f6> <i class="fas fa-folder" data-astro-cid-j7pv25f6></i> Carpeta
</div> </div> <div class="item-actions" data-astro-cid-j7pv25f6> <button class="btn btn-primary"${addAttribute(`window.location.href='?path=${item.path}'`, "onclick")} data-astro-cid-j7pv25f6> <i class="fas fa-folder-open" data-astro-cid-j7pv25f6></i> Abrir
</button> </div> </div> ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` <div class="item-preview" data-astro-cid-j7pv25f6> ${item.isImage ? renderTemplate`<img${addAttribute(`/${item.path}`, "src")}${addAttribute(item.name, "alt")} loading="lazy" data-astro-cid-j7pv25f6>` : renderTemplate`<i${addAttribute(`fas ${item.extension === ".pdf" ? "fa-file-pdf" : item.extension === ".txt" ? "fa-file-alt" : item.extension === ".zip" || item.extension === ".rar" ? "fa-file-archive" : item.extension === ".mp4" || item.extension === ".mov" ? "fa-file-video" : item.extension === ".mp3" || item.extension === ".wav" ? "fa-file-audio" : item.extension === ".doc" || item.extension === ".docx" ? "fa-file-word" : item.extension === ".xls" || item.extension === ".xlsx" ? "fa-file-excel" : item.extension === ".ppt" || item.extension === ".pptx" ? "fa-file-powerpoint" : item.extension === ".js" || item.extension === ".ts" || item.extension === ".jsx" || item.extension === ".tsx" ? "fa-file-code" : "fa-file"} file-icon`, "class")} data-astro-cid-j7pv25f6></i>`} </div> <div class="item-body" data-astro-cid-j7pv25f6> <div class="item-info" data-astro-cid-j7pv25f6> <div class="item-name" data-astro-cid-j7pv25f6>${item.name}</div> <div class="item-details" data-astro-cid-j7pv25f6> <i class="fas fa-database" data-astro-cid-j7pv25f6></i> ${formatBytes(item.size)} <span style="margin: 0 0.25rem;" data-astro-cid-j7pv25f6>•</span> ${item.extension.slice(1).toUpperCase()} </div> </div> <div class="item-actions" data-astro-cid-j7pv25f6> <button class="btn btn-primary"${addAttribute(`copyUrl('/${item.path}')`, "onclick")} data-astro-cid-j7pv25f6> <i class="fas fa-copy" data-astro-cid-j7pv25f6></i> Copiar
</button> <a${addAttribute(`/${item.path}`, "href")} target="_blank" class="btn btn-secondary" style="text-decoration: none; text-align: center;" data-astro-cid-j7pv25f6> <i class="fas fa-external-link-alt" data-astro-cid-j7pv25f6></i> Ver
</a> </div> </div> ` })}`} </div>`)} </div>`, defineScriptVars({ allItems }));
}, "/Users/dev/Documents/hosted.inled.es/src/pages/index.astro", void 0);

const $$file = "/Users/dev/Documents/hosted.inled.es/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
