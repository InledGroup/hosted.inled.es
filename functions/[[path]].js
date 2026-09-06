import assets from '../public/release-assets.json';

const ASSETS_BASE = 'https://github.com/InledGroup/hosted.inled.es/releases/download/assets/';

const byName = new Map();
for (const a of assets.assets) {
  byName.set(a.name, a.url);
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  const isCdn = pathname.startsWith('/cdn/');
  const segment = isCdn ? pathname.slice('/cdn/'.length) : pathname.slice(1);
  if (!segment) return next();

  const decoded = decodeSegment(segment);
  if (!decoded) return next();

  // Regla exacta del índice estático (release-assets.json): preserva las URLs antiguas y /cdn/<archivo>
  const exact = byName.get(decoded);
  if (exact) return Response.redirect(exact, 302);

  // Respaldo para assets recién subidos que aún no están en el índice
  if (isCdn) return Response.redirect(ASSETS_BASE + segment, 302);

  return next();
}