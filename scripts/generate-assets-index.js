import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repo = 'InledGroup/hosted.inled.es';
const token = process.env.GITHUB_TOKEN || '';
const headers = token
  ? { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'hostify-assets-index' }
  : { Accept: 'application/vnd.github+json', 'User-Agent': 'hostify-assets-index' };

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
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

async function getReleaseAssets(releaseId) {
  // Listado paginado de assets de una release
  return getPaginated(`https://api.github.com/repos/${repo}/releases/${releaseId}/assets`, 100);
}

async function main() {
  console.log(`Fetching releases of ${repo}…`);
  const releases = await getPaginated(`https://api.github.com/repos/${repo}/releases`, 100);

  // Solo nos interesan las releases "assets", "assets-2", etc. (hosting de ficheros grandes)
  const assetsReleases = releases.filter(r => {
    if (r.tag_name === 'assets') return true;
    return /^assets-\d+$/.test(r.tag_name);
  });

  const allAssets = [];
  for (const rel of assetsReleases) {
    const assets = await getReleaseAssets(rel.id);
    for (const a of assets) {
      allAssets.push({
        name: a.name,
        size: a.size,
        url: a.browser_download_url,
        release: rel.tag_name,
        content_type: a.content_type,
        uploaded_at: a.updated_at
      });
    }
    console.log(`  [${rel.tag_name}] ${assets.length} assets`);
  }

  allAssets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const payload = {
    generated_at: new Date().toISOString(),
    count: allAssets.length,
    assets: allAssets
  };

  // Guardar en ambos sitios igual que el file-index
  const publicOutputFile = path.join(__dirname, '../public/release-assets.json');
  const srcOutputFile = path.join(__dirname, '../src/data/release-assets.json');
  [path.dirname(publicOutputFile), path.dirname(srcOutputFile)].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const jsonContent = JSON.stringify(payload, null, 2);
  fs.writeFileSync(publicOutputFile, jsonContent);
  fs.writeFileSync(srcOutputFile, jsonContent);

  console.log(`✅ Release assets index: ${allAssets.length} assets (${assetsReleases.length} releases)`);
  console.log(`📍 Public: ${publicOutputFile}`);
  console.log(`📍 Source: ${srcOutputFile}`);
}

main().catch(err => {
  console.error('Error generando índice de assets:', err);
  process.exit(1);
});