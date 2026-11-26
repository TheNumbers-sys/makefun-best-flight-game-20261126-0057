// Static development server for the Skyhook Courier game. It serves only files rooted in game/.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const argIndex = process.argv.indexOf('--port');
const portValue = argIndex < 0 ? 8080 : Number(process.argv[argIndex + 1]);
const port = Number.isInteger(portValue) && portValue > 0 && portValue < 65536 ? portValue : 8080;
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg'
};

createServer((request, response) => {
  let route: string;
  try { route = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('invalid path'); return; }
  if (route.endsWith('/')) route += 'index.html';
  const target = resolve(join(gameRoot, normalize(route)));
  if (target !== gameRoot && !target.startsWith(gameRoot + sep)) { response.writeHead(403).end('outside game'); return; }
  let length: number;
  try { const info = statSync(target); if (!info.isFile()) throw new Error(); length = info.size; }
  catch { response.writeHead(404).end('missing file'); return; }
  response.writeHead(200, { 'content-type': contentTypes[extname(target)] ?? 'application/octet-stream', 'content-length': length, 'cache-control': 'no-store' });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => process.stdout.write(`Skyhook Courier is served at http://localhost:${port}\n`));
