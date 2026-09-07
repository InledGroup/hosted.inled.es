import fs from 'fs';
import path from 'path';

const repo = 'InledGroup/hosted.inled.es';
const ASSET_RELEASE_TAG = 'assets';
const ASSETS_PER_RELEASE_LIMIT = 1000;

const token = process.env.GITHUB_TOKEN || '';
const issueNumber = process.env.GH_ISSUE_NUMBER || '';
const issueBody = process.env.GH_ISSUE_BODY || '';

const apiHeaders = {
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'hostify-issue-upload'
};

const EXT_TO_TYPE = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};

const TYPE_TO_EXT = Object.fromEntries(Object.entries(EXT_TO_TYPE).map(([k, v]) => [v, k]));

function sanitizeName(name) {
  return name.replace(/\s+/g, '-');
}

function urlBase(url) {
  const noQuery = url.split(/[?#]/)[0];
  return decodeBase(noQuery.split('/').pop() || '');
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...apiHeaders, ...(opts.headers || {}) } });
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${url} -> ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function getPaginated(url, perPage = 100) {
  const all = [];
  let page = 1;
  while (true) {
    const list = await fetchJson(`${url}?per_page=${perPage}&page=${page}`);
    if (!Array.isArray(list) || list.length === 0) break;
    all.push(...list);
    if (list.length < perPage) break;
    page += 1;
  }
  return all;
}

async function postComment(body) {
  if (!issueNumber) return;
  await fetchJson(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  });
}

async function getOrCreateAssetsRelease() {
  const releases = await getPaginated(`https://api.github.com/repos/${repo}/releases`);
  const assetReleases = releases.filter(r =>
    r.tag_name === ASSET_RELEASE_TAG || /^assets-\d+$/.test(r.tag_name)
  );

  for (const rel of assetReleases) {
    const assets = await fetchJson(`https://api.github.com/repos/${repo}/releases/${rel.id}/assets`);
    if (assets.length < ASSETS_PER_RELEASE_LIMIT) return rel;
  }

  let maxNum = assetReleases.some(r => r.tag_name === ASSET_RELEASE_TAG) ? 1 : 0;
  assetReleases.forEach(r => {
    const m = /^assets-(\d+)$/.exec(r.tag_name);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  });
  const nextTag = maxNum >= 1 ? `${ASSET_RELEASE_TAG}-${maxNum + 1}` : ASSET_RELEASE_TAG;

  const res = await fetchJson(`https://api.github.com/repos/${repo}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: nextTag,
      name: `Hostify Assets (archivos grandes) ${nextTag === 'assets' ? '' : '- ' + nextTag}`.trim(),
      body: 'Release utilizada por la interfaz de Hostify para alojar imágenes, GIFs y vídeos.',
      draft: false,
      prerelease: false
    })
  });
  return res;
}

async function listAssets(releaseId) {
  return getPaginated(`https://api.github.com/repos/${repo}/releases/${releaseId}/assets`);
}

async function deleteAsset(assetId) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/assets/${assetId}`, {
    method: 'DELETE',
    headers: apiHeaders
  });
  if (!res.ok) throw new Error(`DELETE asset ${assetId} -> ${res.status}`);
}

async function uploadAsset(release, fileName, buffer, contentType) {
  const uploadUrl = release.upload_url.replace('{?name,label}', '');
  const url = `${uploadUrl}?name=${encodeURIComponent(fileName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...apiHeaders,
      'Content-Type': contentType || 'application/octet-stream'
    },
    body: buffer
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload ${fileName} -> ${res.status} ${body.slice(0, 300)}`);
  }
  return res.json();
}

function extractImageUrls(body) {
  const all = body.match(/https?:\/\/[^\s<>"')\]]+/g) || [];
  const seen = new Set();
  const urls = [];
  for (const u of all) {
    const isAttachment =
      /user-images\.githubusercontent\.com/.test(u) ||
      /user-attachments/.test(u) ||
      /\.[a-z0-9]{2,5}(\?.*)?$/i.test(u.split(/[?#]/)[0]);
    if (isAttachment && !seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  }
  return urls;
}

function decodeBase(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

// Nombre en la marca de la imagen, p.ej: ![mi-foto.png](url)
function markdownAlt(body, url) {
  const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`!\\[([^\\]]*)\\]\\(\\s*${esc}\\s*\\)`);
  const m = body.match(re);
  return m ? m[1].trim() : '';
}

// Nombre pedido explícitamente en el campo "**Nombre:**" de la plantilla
function requestedName(body) {
  const m = body.match(/^\s*\*{0,2}Nombre\*{0,2}:?\*{0,2}\s*(\S.*)$/mi);
  return m ? m[1].trim() : '';
}

// GitHub incluye el nombre original en la URL final de los adjuntos nuevos (user-attachments)
function originalNameFromFinalUrl(resUrl) {
  const m = /[?&]filename=([^&#]+)/i.exec(resUrl) || /[?&]name=([^&#]+)/i.exec(resUrl);
  if (m) return decodeBase(m[1].split('?')[0]).trim();
  return '';
}

async function main() {
  const urls = extractImageUrls(issueBody);
  if (urls.length === 0) {
    await postComment('⚠️ No se detectaron archivos adjuntos en la issue. Cerrando.');
    console.error('No image URLs found in issue body.');
    process.exit(1);
  }

  const customName = requestedName(issueBody);

  await postComment(`⏳ (2/4) Se detectaron **${urls.length}** archivo(s). Descargando y subiendo…`);
  const release = await getOrCreateAssetsRelease();
  const existing = await listAssets(release.id);

  const uploaded = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Descarga ${url} -> ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = (res.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();

    // 1. Preferencia: nombre explícito en la plantilla (solo si hay un único archivo)
    // 2. Nombre original recuperado de la URL final de GitHub (parámetro filename=)
    // 3. Alt text de la imagen (solo si incluye extensión, para ignorar el "image" genérico)
    // 4. Última parte del path original
    let fileName;
    if (urls.length === 1 && customName) {
      fileName = customName;
    } else {
      const fromFinal = originalNameFromFinalUrl(res.url || url);
      if (fromFinal) {
        fileName = fromFinal;
      } else {
        const rawAlt = markdownAlt(issueBody, url);
        fileName = path.extname(rawAlt) ? rawAlt : urlBase(url) || '';
      }
    }

    if (!fileName || !path.extname(fileName)) {
      fileName = fileName || `issue-${issueNumber}`;
      const ext = TYPE_TO_EXT[contentType] || '.bin';
      if (!path.extname(fileName)) fileName = `${fileName}${ext}`;
    }
    fileName = sanitizeName(fileName);

    const dup = existing.find(a => a.name === fileName);
    if (dup) {
      await deleteAsset(dup.id);
      await postComment(`♻️ Reemplazando archivo existente **${fileName}**.`);
    }

    const asset = await uploadAsset(release, fileName, buffer, EXT_TO_TYPE[path.extname(fileName).toLowerCase()] || contentType);
    existing.push({ name: asset.name });
    uploaded.push(asset.name);

    await postComment(`✅ (${i + 1}/${urls.length}) **${asset.name}** subido a GitHub Releases.`);
    console.log(`Uploaded ${asset.name} (${buffer.length} bytes)`);
  }

  if (uploaded.length > 0) {
    const sep = ', ';
    console.log(`DONE: ${uploaded.join(sep)}`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${uploaded.length}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `files=${uploaded.join(',')}\n`);
    }
  }
}

main().catch(err => {
  console.error('Error procesando issue de upload:', err);
  process.exit(1);
});