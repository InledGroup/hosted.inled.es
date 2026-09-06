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
  byName.set(a.name, { url: a.url, contentType: a.content_type });
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

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

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