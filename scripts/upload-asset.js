#!/usr/bin/env node
// Sube un archivo local (hasta 2 GB) directo a GitHub Releases del repo,
// regenera el índice de assets y lo commitea/pushea (opcional).
//
// Uso:
//   node scripts/upload-asset.js <archivo> [--name nombre.ext] [--repo InledGroup/hosted.inled.es] [--no-push]
//
// Autenticación (en orden): $GITHUB_TOKEN, o el token de la CLI `gh`.

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO = 'InledGroup/hosted.inled.es';
const ASSET_RELEASE_TAG = 'assets';
const ASSETS_PER_RELEASE_LIMIT = 1000;
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

function args() {
  const positional = [];
  const opts = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '--name') { opts.name = raw[++i]; }
    else if (raw[i] === '--repo') { opts.repo = raw[++i]; }
    else if (raw[i] === '--no-push') { opts.push = false; }
    else if (raw[i] === '--push') { opts.push = true; }
    else { positional.push(raw[i]); }
  }
  opts.push = opts.push !== false;
  return { positional, opts };
}

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const gh = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8' });
  if (gh.status === 0 && gh.stdout.trim()) return gh.stdout.trim();
  console.error('No se encontró token. Exporta GITHUB_TOKEN o ejecuta "gh auth login".');
  process.exit(1);
}

const EXT_TO_TYPE = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};

function sanitizeName(name) {
  return name.replace(/\s+/g, '-');
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...apiHeaders, ...(opts.headers || {}) } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${opts.method || 'GET'} ${url} -> ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
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

async function deleteAsset(assetId) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/assets/${assetId}`, {
    method: 'DELETE',
    headers: apiHeaders
  });
  if (!res.ok) throw new Error(`DELETE asset ${assetId} -> ${res.status}`);
}

async function uploadAsset(release, fileName, filePath, contentType) {
  const size = fs.statSync(filePath).size;
  const uploadUrl = release.upload_url.replace('{?name,label}', '');
  const url = `${uploadUrl}?name=${encodeURIComponent(fileName)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...apiHeaders,
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Length': String(size)
    },
    body: fs.createReadStream(filePath),
    duplex: 'half'
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upload ${fileName} -> ${res.status} ${body.slice(0, 300)}`);
  }
  return res.json();
}

function runIndexGeneration() {
  const res = spawnSync(process.execPath, [path.join(__dirname, 'generate-assets-index.js')], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_TOKEN: token }
  });
  process.stdout.write(res.stdout || '');
  process.stderr.write(res.stderr || '');
  if (res.status !== 0) {
    console.error('Error regenerando índice de assets.');
    process.exit(1);
  }
}

function commitAndPush(files, message) {
  const git = (...a) => spawnSync('git', a, { encoding: 'utf8', stdio: 'inherit' });
  git('add', ...files);
  const diff = spawnSync('git', ['diff', '--cached', '--quiet'], { encoding: 'utf8' });
  if (diff.status === 0) {
    console.log('No changes in release assets index. Skipping commit.');
    return;
  }
  const commit = git('commit', '-m', message);
  if (commit.status !== 0) process.exit(1);
  const push = git('push');
  if (push.status !== 0) process.exit(1);
}

const { positional, opts } = args();
const repo = opts.repo || DEFAULT_REPO;
let apiHeaders;

function main() {
  if (positional.length < 1) {
    console.error('Uso: node scripts/upload-asset.js <archivo> [--name nombre.ext] [--repo ...] [--no-push]');
    process.exit(1);
  }

  const filePath = path.resolve(positional[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`No existe el archivo: ${filePath}`);
    process.exit(1);
  }
  const size = fs.statSync(filePath).size;
  if (size > MAX_SIZE) {
    console.error(`El archivo supera el límite de 2 GB de GitHub Releases (${size} bytes).`);
    process.exit(1);
  }

  token = getToken();
  apiHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'hostify-local-upload'
  };

  let fileName = opts.name || path.basename(filePath);
  fileName = sanitizeName(fileName);
  if (!path.extname(fileName)) {
    console.error(`El nombre debe incluir extensión (ej: --name "video.mp4"). Recibido: "${fileName}"`);
    process.exit(1);
  }
  const contentType = EXT_TO_TYPE[path.extname(fileName).toLowerCase()] || 'application/octet-stream';

  console.log(`📦 Subiendo: ${fileName} (${(size / (1024 * 1024)).toFixed(1)} MB) → ${repo}`);

  getOrCreateAssetsRelease()
    .then(async (release) => {
      const existing = await getPaginated(`https://api.github.com/repos/${repo}/releases/${release.id}/assets`);
      const dup = existing.find(a => a.name === fileName);
      if (dup) {
        console.log(`♻️ Reemplazando asset existente "${fileName}".`);
        await deleteAsset(dup.id);
      }
      const asset = await uploadAsset(release, fileName, filePath, contentType);
      console.log(`✅ Subido: ${asset.browser_download_url}`);

      console.log('\n➡️ Regenerando índice de assets…');
      runIndexGeneration();

      console.log('\n➡️ Datos del archivo:');
      console.log(`   Nombre:     ${asset.name}`);
      console.log(`   Tamaño:     ${(asset.size / (1024 * 1024)).toFixed(1)} MB`);
      console.log(`   GitHub URL: ${asset.browser_download_url}`);
      console.log(`   Host URL:   https://hosted.inled.es/cdn/${encodeURIComponent(asset.name)}`);

      if (opts.push) {
        console.log('\n➡️ Commit y push del índice…');
        commitAndPush(
          ['public/release-assets.json', 'src/data/release-assets.json'],
          '[SYSTEM] Sync release assets index'
        );
      } else {
        console.log('\n⚠️ No se hizo push. Si quieres publicar el índice, ejecuta el commit/push de public/release-assets.json y src/data/release-assets.json.');
      }
    })
    .catch(err => {
      console.error('Error:', err.message || err);
      process.exit(1);
    });
}

let token;
main();