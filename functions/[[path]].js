import assets from '../public/release-assets.json';

const ASSETS_BASE = 'https://github.com/InledGroup/hosted.inled.es/releases/download/assets/';

// GitHub sanitiza los nombres de asset (solo alfanumérico, '-', '_', '.'),
// de modo que estas URLs antiguas apuntan a ellos sin coincidir en el mapa.
const ALIASES = {
  'aparienciawinerror copia.png': 'aparienciawinerror.copia.png',
  'codexbar for gnome.png': 'codexbar.for.gnome.png',
  'Google_Chrome_icon_(February_2022).svg': 'Google_Chrome_icon_.February_2022.svg',
  'ies-rafael-puga-ramon-orientacion-puga-website-\u2010-Inled-Group.gif': 'ies-rafael-puga-ramon-orientacion-puga-website-.-Inled-Group.gif',
  'imhuman copia.png': 'imhuman.copia.png',
  'start-omnibox-inled.es-gif-\u2010-Hecho-con-Clipchamp.gif': 'start-omnibox-inled.es-gif-.-Hecho-con-Clipchamp.gif'
};

const byName = new Map();
for (const a of assets.assets) {
  byName.set(a.name, { url: a.url, contentType: a.content_type, size: a.size });
}

// Tipos MIME y extensiones conocidas para previsualización
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

function getExtension(name) {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.substring(idx).toLowerCase();
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(extension) {
  const icons = {
    '.pdf': 'fa-file-pdf',
    '.txt': 'fa-file-alt',
    '.zip': 'fa-file-archive',
    '.rar': 'fa-file-archive',
    '.7z': 'fa-file-archive',
    '.tar': 'fa-file-archive',
    '.gz': 'fa-file-archive',
    '.mp4': 'fa-file-video',
    '.mov': 'fa-file-video',
    '.mp3': 'fa-file-audio',
    '.wav': 'fa-file-audio',
    '.doc': 'fa-file-word',
    '.docx': 'fa-file-word',
    '.xls': 'fa-file-excel',
    '.xlsx': 'fa-file-excel',
    '.ppt': 'fa-file-powerpoint',
    '.pptx': 'fa-file-powerpoint',
    '.js': 'fa-file-code',
    '.ts': 'fa-file-code',
    '.html': 'fa-file-code',
    '.css': 'fa-file-code',
    '.json': 'fa-file-code'
  };
  return icons[extension] || 'fa-file';
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function resolve(decoded) {
  return byName.get(decoded) || byName.get(ALIASES[decoded]) || null;
}

// Escapa texto para HTML para evitar inyección con nombres no controlados
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonSafe(str) {
  return esc(str).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}

// Genera la página dedicada para un asset. Sirve tanto para release assets
// (mirror de GitHub) como para archivos de la carpeta public/.
function renderAssetPage({ name, contentUrl, size }) {
  const ext = getExtension(name);
  const isImage = IMAGE_EXTENSIONS.includes(ext);
  const isVideo = VIDEO_EXTENSIONS.includes(ext);
  const isAudio = AUDIO_EXTENSIONS.includes(ext);

  const sizeLabel = size ? formatBytes(size) : '';

  const loadingState = `
    <div class="preview-state" data-state="loading"><div class="spinner"></div></div>
    <div class="preview-state hidden" data-state="error"><i class="fas fa-exclamation-triangle"></i><span>Failed to load</span></div>`;

  let previewHtml;
  if (isImage) {
    previewHtml = `<div class="preview-media preview-image preview-load">${loadingState}<img src="${contentUrl}" alt="${esc(name)}" onload="previewLoaded(this)" onerror="previewError(this)" /></div>`;
  } else if (isVideo) {
    previewHtml = `<div class="preview-media preview-load preview-load-video">${loadingState}<video src="${contentUrl}" controls preload="metadata" onloadeddata="previewLoaded(this)" onerror="previewError(this)"></video></div>`;
  } else if (isAudio) {
    previewHtml = `<div class="preview-media preview-audio preview-load">${loadingState}<audio src="${contentUrl}" controls onloadeddata="previewLoaded(this)" onerror="previewError(this)"></audio></div>`;
  } else {
    previewHtml = `<div class="preview-icon"><i class="fas ${getFileIcon(ext)}"></i></div>`;
  }

  const pageUrl = `https://hosted.inled.es/asset/${encodeURIComponent(name)}`;
  const typeLabel = ext ? ext.slice(1).toUpperCase() : 'FILE';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Download, share and preview this asset hosted on hosted.inled.es">
<title>${esc(name)} · Hostify</title>
<link rel="icon" type="image/png" href="/hostify.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
:root{--bg:#f8fafc;--card:#ffffff;--border:#e2e8f0;--foreground:#0f172a;--muted:#64748b;--muted-2:#94a3b8;--accent:#f1f5f9;--primary:#0f172a;--primary-hover:#1e293b;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--foreground);line-height:1.6;min-height:100vh;}
a{text-decoration:none;color:inherit;}
.container{max-width:880px;margin:0 auto;padding:1.5rem 1rem 3rem;}
.header{background:#fff;border-bottom:1px solid var(--border);padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between;}
.brand{display:flex;align-items:center;gap:.625rem;font-weight:800;color:var(--foreground);}
.brand img{width:30px;height:30px;border-radius:8px;}
.back{display:inline-flex;align-items:center;gap:.4rem;font-size:.8125rem;font-weight:600;color:var(--muted);padding:.5rem .75rem;border-radius:.5rem;border:1px solid var(--border);background:#fff;transition:all .15s ease;}
.back:hover{background:var(--accent);color:var(--foreground);}
.card{background:var(--card);border:1px solid var(--border);border-radius:1rem;box-shadow:0 1px 2px rgba(0,0,0,.04);overflow:hidden;margin-top:1.5rem;}
.preview-media{width:100%;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.preview-media img{max-width:100%;max-height:480px;object-fit:contain;display:block;margin:0 auto;}
.preview-media video{width:100%;max-height:480px;background:#020617;}
.preview-media audio{width:100%;padding:2.5rem 1.5rem;}
.preview-image{padding:1.5rem;background:var(--accent);}
.preview-icon{display:flex;align-items:center;justify-content:center;padding:3.5rem;background:var(--accent);border-bottom:1px solid var(--border);}
.preview-icon i{font-size:5rem;color:var(--muted-2);}
.preview-load{position:relative;}
.preview-load-video{background:#020617;}
.preview-load img,.preview-load video,.preview-load audio{position:relative;z-index:2;opacity:0;transition:opacity .2s ease;}
.preview-load img.loaded,.preview-load video.loaded,.preview-load audio.loaded{opacity:1;}
.preview-state{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;color:var(--muted-2);pointer-events:none;}
.preview-state[data-state="loading"]{cursor:progress;}
.preview-state[data-state="error"] i{font-size:1.75rem;color:#f59e0b;}
.preview-state[data-state="error"] span{font-size:.75rem;color:var(--muted);font-weight:500;}
.spinner{width:2rem;height:2rem;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.hidden{display:none !important;}
.body{padding:1.5rem;}
.meta{margin-bottom:1.25rem;}
.name{font-size:1.125rem;font-weight:700;color:var(--foreground);word-break:break-word;margin-bottom:.375rem;}
.details{font-size:.8125rem;color:var(--muted);display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;}
.tag{display:inline-flex;align-items:center;gap:.35rem;background:var(--accent);border:1px solid var(--border);color:var(--muted);font-weight:600;font-size:.6875rem;padding:.125rem .5rem;border-radius:999px;}
.actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.75rem;margin-top:1.25rem;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:0 1rem;height:2.75rem;border-radius:.625rem;border:1px solid transparent;font-size:.875rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s ease;}
.btn i{font-size:.875rem;}
.btn-primary{background:var(--primary);color:#fff;}
.btn-primary:hover{background:var(--primary-hover);}
.btn-outline{background:#fff;border-color:var(--border);color:var(--foreground);}
.btn-outline:hover{background:var(--accent);}
.url-box{margin-top:1.5rem;}
.url-label{font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem;}
.url-input{display:flex;gap:.5rem;}
.url-input input{flex:1;height:2.5rem;padding:0 .875rem;font-size:.8125rem;font-family:inherit;border:1px solid var(--border);border-radius:.5rem;color:var(--muted);background:var(--accent);outline:none;}
.toast{position:fixed;bottom:2rem;right:2rem;background:var(--primary);color:#fff;padding:.875rem 1.25rem;border-radius:.5rem;box-shadow:0 12px 32px rgba(15,23,42,.25);transform:translateX(400px);opacity:0;transition:all .35s cubic-bezier(.4,0,.2,1);z-index:1000;display:flex;align-items:center;gap:.625rem;font-size:.875rem;font-weight:500;}
.toast i{color:#4ade80;}
.toast.show{transform:translateX(0);opacity:1;}
@media(max-width:600px){.actions{grid-template-columns:1fr;}.url-input{flex-direction:column;}}
</style>
</head>
<body>
<div class="header">
  <a class="brand" href="/"><img src="/hostify.png" alt="Hostify"/>Hostify</a>
  <a class="back" href="/"><i class="fas fa-arrow-left"></i> Back</a>
</div>
<div class="container">
  <div class="card">
    ${previewHtml}
    <div class="body">
      <div class="meta">
        <div class="name">${esc(name)}</div>
        <div class="details">
          ${sizeLabel ? `<span class="tag"><i class="fas fa-database"></i> ${esc(sizeLabel)}</span>` : ''}
          <span class="tag">${esc(typeLabel)}</span>
          <span class="tag"><i class="fas fa-rocket"></i> Release</span>
        </div>
      </div>
      <div class="actions">
        <a class="btn btn-primary" href="${contentUrl}" download="${esc(name)}"><i class="fas fa-download"></i> Download</a>
        <button class="btn btn-outline" id="shareBtn"><i class="fas fa-share-alt"></i> Share</button>
        <button class="btn btn-outline" id="copyAssetBtn"><i class="fas fa-copy"></i> Copy asset</button>
      </div>
      <div class="url-box">
        <div class="url-label"><i class="fas fa-link"></i> Public link</div>
        <div class="url-input">
          <input id="pageUrl" type="text" value="${esc(pageUrl)}" readonly onclick="this.select()">
          <button class="btn btn-outline" id="copyUrlBtn"><i class="fas fa-copy"></i> Copy</button>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
(function(){
  const pageUrl = ${"`" + jsonSafe(pageUrl) + "`"};
  const contentUrl = ${"`" + jsonSafe(contentUrl) + "`"};
  const name = ${"`" + jsonSafe(name) + "`"};
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg){toastEl.innerHTML=msg;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){toastEl.classList.remove('show');},3000);}
  function copyText(text, okMsg){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){showToast('<i class="fas fa-check-circle"></i> '+okMsg);}).catch(function(){fallbackCopy(text,okMsg);});
    } else { fallbackCopy(text,okMsg); }
  }
  function fallbackCopy(text,okMsg){
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');showToast('<i class="fas fa-check-circle"></i> '+okMsg);}catch(e){showToast('<i class="fas fa-exclamation-circle"></i> Could not copy');}
    document.body.removeChild(ta);
  }
  function previewLoaded(media){
    const wrap=media.closest('.preview-load');
    media.classList.add('loaded');
    if(wrap){
      const loading=wrap.querySelector('[data-state="loading"]');if(loading)loading.classList.add('hidden');
      const err=wrap.querySelector('[data-state="error"]');if(err)err.classList.add('hidden');
    }
  }
  function previewError(media){
    const wrap=media.closest('.preview-load');
    if(wrap){
      const loading=wrap.querySelector('[data-state="loading"]');if(loading)loading.classList.add('hidden');
      const err=wrap.querySelector('[data-state="error"]');if(err)err.classList.remove('hidden');
    }
  }
  window.previewLoaded=previewLoaded;
  window.previewError=previewError;
  document.getElementById('copyUrlBtn').addEventListener('click',function(){copyText(pageUrl,'Link copied to clipboard');});
  document.getElementById('shareBtn').addEventListener('click',function(){
    if(navigator.share){navigator.share({title:name,url:pageUrl}).catch(function(){});}
    else{copyText(pageUrl,'Link copied to clipboard');}
  });
  document.getElementById('copyAssetBtn').addEventListener('click',async function(){
    try{
      const res=await fetch(contentUrl);
      if(!res.ok) throw new Error('fetch fail');
      const blob=await res.blob();
      if(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem && blob.type && blob.type!=='application/octet-stream' && blob.type.indexOf('text/')!==0){
        await navigator.clipboard.write([new ClipboardItem({[blob.type]:blob})]);
        showToast('<i class="fas fa-check-circle"></i> Asset copied to clipboard');
      } else {
        copyText(contentUrl,'Asset link copied to clipboard');
      }
    }catch(e){
      copyText(contentUrl,'Asset link copied to clipboard');
    }
  });
})();
</script>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Página dedicada por asset: /asset/<nombre>
  if (pathname.startsWith('/asset/')) {
    const raw = pathname.slice('/asset/'.length);
    if (!raw) return next();
    const name = decodeSegment(raw);
    if (!name) return next();
    const releaseAsset = resolve(name);
    if (releaseAsset) {
      const page = renderAssetPage({
        name,
        contentUrl: '/cdn/' + encodeURIComponent(name),
        contentType: releaseAsset.contentType,
        size: releaseAsset.size
      });
      return new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    // Archivos de la carpeta public/ (se sirven bajo la raíz vía /1/)
    const publicPath = '/' + name;
    const page = renderAssetPage({
      name,
      contentUrl: publicPath,
      contentType: null,
      size: null
    });
    return new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  const isCdn = pathname.startsWith('/cdn/');
  const isPreview = pathname.startsWith('/preview/');
  const prefix = isCdn ? '/cdn/' : isPreview ? '/preview/' : '/';
  const segment = pathname.slice(prefix.length);
  if (!segment) return next();

  const decoded = decodeSegment(segment);
  if (!decoded) return next();

  const asset = resolve(decoded);
  if (asset) {
    // SVG: GitHub sirve todo como octet-stream y los navegadores no renderizan
    // SVG en <img> con ese MIME. Se re-sirve inline con su MIME real tanto en
    // /preview/ (página nueva) como en /cdn/ (página con caché antigua del edge).
    if (/\.svg$/i.test(decoded) && (isPreview || isCdn || pathname === '/' + decoded)) {
      const res = await fetch(asset.url, { redirect: 'follow' });
      const body = await res.arrayBuffer();
      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': asset.contentType || 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
    return Response.redirect(asset.url, 302);
  }

  // Respaldo para assets recién subidos que aún no están en el índice
  if (isCdn) return Response.redirect(ASSETS_BASE + segment, 302);
  if (isPreview) return Response.redirect(ASSETS_BASE + segment, 302);

  return next();
}