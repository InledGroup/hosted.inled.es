#!/usr/bin/env node
// Sube un archivo local (hasta 2 GB) directo a GitHub Releases del repo,
// regenera el índice de assets y lo commitea/pushea (opcional).
//
// Uso:
//   node scripts/upload-asset.js [ruta] [--name nombre.ext] [--repo owner/repo] [--no-push] [--progress]
//
// Sin argumentos abre el selector de archivos nativo del sistema
// (zenity/kdialog/qarma/matedialog/yad), o pide la ruta por consola.
//
// Con --progress, stdout solo emite líneas máquina-legibles:
//   PROGRESS <pct>
//   RESULT <github-url>
//   HOST <url>
// y el resto de logs van a stderr.
//
// Autenticación (en orden): $GITHUB_TOKEN, o el token de la CLI `gh`.

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Transform } from 'stream';
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
    else if (raw[i] === '--progress') { opts.progress = true; }
    else { positional.push(raw[i]); }
  }
  opts.push = opts.push !== false;
  return { positional, opts };
}

const { positional, opts } = args();
const repo = opts.repo || DEFAULT_REPO;
let token;
let apiHeaders;

// En modo --progress stdout queda reservado para PROGRESS/RESULT/HOST.
function log(...msg) {
  const line = msg.join(' ');
  if (opts.progress) process.stderr.write(line + '\n');
  else console.log(line);
}

function reportProgress(pct) {
  if (!opts.progress) return;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  process.stdout.write(`PROGRESS ${clamped}\n`);
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

// Abre el selector de archivos nativo del sistema (GTK/Qt) y devuelve la ruta elegida.
// Si no hay entorno gráfico, pide la ruta por consola.
function pickFile() {
  const pickers = [
    { bin: 'zenity', args: ['--file-selection', '--title=Selecciona el archivo a subir'] },
    { bin: 'kdialog', args: ['--getopenfilename', '.'] },
    { bin: 'qarma', args: ['--file-selection', '--title=Selecciona el archivo a subir'] },
    { bin: 'matedialog', args: ['--file-selection', '--title=Selecciona el archivo a subir'] },
    { bin: 'yad', args: ['--file', '--title=Selecciona el archivo a subir'] }
  ];

  for (const p of pickers) {
    const which = spawnSync('which', [p.bin], { encoding: 'utf8' });
    if (which.status !== 0) continue;
    const res = spawnSync(p.bin, p.args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    if (res.status === 1) {
      log('Cancelado.');
      process.exit(0);
    }
    if (res.status === 0 && res.stdout && res.stdout.trim()) return res.stdout.trim();
    break;
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('No se encontró un selector gráfico. Pega la ruta del archivo a subir: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function fetchJson(url, requestOpts = {}) {
  const res = await fetch(url, { ...requestOpts, headers: { ...apiHeaders, ...(requestOpts.headers || {}) } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${requestOpts.method || 'GET'} ${url} -> ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
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

// Sube el archivo con progreso real de bytes leídos del disco (5 % → 90 %).
async function uploadAsset(release, fileName, filePath, contentType) {
  const size = fs.statSync(filePath).size;
  const uploadUrl = release.upload_url.replace('{?name,label}', '');
  const url = `${uploadUrl}?name=${encodeURIComponent(fileName)}`;

  let sent = 0;
  let lastPct = -1;
  const meter = new Transform({
    transform(chunk, _enc, cb) {
      sent += chunk.length;
      const pct = size > 0 ? 5 + Math.floor((sent / size) * 85) : 50;
      if (pct !== lastPct) {
        lastPct = pct;
        reportProgress(pct);
      }
      cb(null, chunk);
    }
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...apiHeaders,
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Length': String(size)
    },
    body: fs.createReadStream(filePath).pipe(meter),
    duplex: 'half'
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upload ${fileName} -> ${res.status} ${body.slice(0, 300)}`);
  }
  reportProgress(90);
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

function gitRepoRoot() {
  // Resuelve la raíz del repo desde la carpeta del script (no del CWD actual),
  // para que el commit funcione aunque se ejecute como ./scripts/upload-asset.js
  const res = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8'
  });
  if (res.status !== 0) {
    console.error('No se pudo determinar la raíz del repositorio git.');
    process.exit(1);
  }
  return res.stdout.trim();
}

// Las modificaciones de índice son generadas: en un rebase nos quedamos con
// nuestra versión (la recién generada) para resolver conflictos.
function syncWithOrigin(repoRoot) {
  const git = (...a) => spawnSync('git', ['-C', repoRoot, ...a], {
    encoding: 'utf8',
    stdio: 'inherit',
    timeout: 180000
  });

  const fetch = git('fetch', 'origin', 'main');
  if (fetch.status !== 0) return false;

  const head = spawnSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const remote = spawnSync('git', ['-C', repoRoot, 'rev-parse', 'origin/main'], { encoding: 'utf8' });
  if (head.stdout.trim() === remote.stdout.trim()) return true;

  const rebase = git('rebase', '--autostash', '-X', 'theirs', 'origin/main');
  if (rebase.status !== 0) {
    git('rebase', '--abort');
    return false;
  }
  return true;
}

function commitAndPush(files, message) {
  const repoRoot = gitRepoRoot();
  const git = (...a) => spawnSync('git', ['-C', repoRoot, ...a], {
    encoding: 'utf8',
    stdio: 'inherit',
    timeout: 180000
  });

  reportProgress(94);
  if (git('add', ...files).status !== 0) {
    console.error('Error al hacer git add de los ficheros del índice.');
    process.exit(1);
  }

  const diff = spawnSync('git', ['-C', repoRoot, 'diff', '--cached', '--quiet'], { encoding: 'utf8' });
  if (diff.status === 0) {
    log('No changes in release assets index. Skipping commit.');
    return;
  }

  reportProgress(96);
  if (git('commit', '-m', message).status !== 0) process.exit(1);

  // El workflow "Sync Release Assets Index" del repo también commitea cada 30 min,
  // así que el push puede ser rechazado si origin avanzó mientras subíamos.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const push = git('push');
    if (push.status === 0) {
      reportProgress(100);
      return;
    }

    log(`Push rechazado (intento ${attempt}/3). Sincronizando con origin/main…`);
    if (!syncWithOrigin(repoRoot)) break;
  }

  console.error('No se pudo pushear el índice tras sincronizar con origin/main.');
  process.exit(1);
}

async function main() {
  reportProgress(1);
  if (positional.length < 1) {
    log('Abriendo selector de archivos…');
  }

  const filePath = positional.length >= 1 ? path.resolve(positional[0]) : await pickFile();
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

  log(`📦 Subiendo: ${fileName} (${(size / (1024 * 1024)).toFixed(1)} MB) → ${repo}`);

  reportProgress(3);
  const release = await getOrCreateAssetsRelease();
  const existing = await getPaginated(`https://api.github.com/repos/${repo}/releases/${release.id}/assets`);
  const dup = existing.find(a => a.name === fileName);
  if (dup) {
    log(`♻️ Reemplazando asset existente "${fileName}".`);
    await deleteAsset(dup.id);
  }

  const asset = await uploadAsset(release, fileName, filePath, contentType);
  log(`✅ Subido: ${asset.browser_download_url}`);

  log('\n➡️ Regenerando índice de assets…');
  reportProgress(92);
  runIndexGeneration();

  const hostUrl = `https://hosted.inled.es/cdn/${encodeURIComponent(asset.name)}`;
  log('\n➡️ Datos del archivo:');
  log(`   Nombre:     ${asset.name}`);
  log(`   Tamaño:     ${(asset.size / (1024 * 1024)).toFixed(1)} MB`);
  log(`   GitHub URL: ${asset.browser_download_url}`);
  log(`   Host URL:   ${hostUrl}`);

  if (opts.progress) {
    process.stdout.write(`RESULT ${asset.browser_download_url}\n`);
    process.stdout.write(`HOST ${hostUrl}\n`);
  }

  if (opts.push) {
    log('\n➡️ Commit y push del índice…');
    commitAndPush(
      ['public/release-assets.json', 'src/data/release-assets.json'],
      '[SYSTEM] Sync release assets index'
    );
  } else {
    log('\n⚠️ No se hizo push. Si quieres publicar el índice, ejecuta el commit/push de public/release-assets.json y src/data/release-assets.json.');
  }
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
