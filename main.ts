// Package the static game and its browser renders, then produce the deterministic judge dossier.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gamePath = join(destination, 'game');
const screenshotPath = join(destination, 'screenshots');

mkdirSync(destination, { recursive: true });
cpSync(join(repository, 'game'), gamePath, { recursive: true });
mkdirSync(screenshotPath, { recursive: true });
if (existsSync(join(repository, 'screenshots'))) cpSync(join(repository, 'screenshots'), screenshotPath, { recursive: true });

const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000
});
writeFileSync(join(destination, 'dossier.json'), dossier);
