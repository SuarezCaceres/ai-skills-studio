#!/usr/bin/env node
/**
 * Sincroniza el snapshot estático de respaldo del directorio https://www.skills.sh
 * en `public/data/skills-sh-snapshot.json`.
 *
 * - Descarga página 0 de las 3 vistas (`all-time`, `trending`, `hot`) con timeout de 15 s.
 * - Sanea cada entrada y conserva las primeras 100 skills por vista junto al `total` real.
 * - Si cualquier vista falla o llega vacía, sale con código 1 sin corromper el archivo previo.
 */

import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UPSTREAM_ORIGIN = 'https://www.skills.sh';
const VIEWS = /** @type {const} */ (['all-time', 'trending', 'hot']);
const TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_SKILLS_PER_VIEW = 100;
const MAX_WEEKLY_POINTS = 16;
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_PATH = path.resolve(__dirname, '..', 'public', 'data', 'skills-sh-snapshot.json');

/**
 * Sanea una entrada cruda de skills.sh siguiendo el contrato `SkillsShRawItem`.
 * @param {unknown} raw
 */
function sanitizeSkillItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const source = typeof raw.source === 'string' ? raw.source.trim() : '';
  const skillId = typeof raw.skillId === 'string' ? raw.skillId.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';

  if (!source || source.length > 200 || CONTROL_CHAR_RE.test(source) || /\s/.test(source)) {
    return null;
  }
  if (!skillId || skillId.length > 150 || CONTROL_CHAR_RE.test(skillId) || /\s/.test(skillId)) {
    return null;
  }
  if (!name || name.length > 150 || CONTROL_CHAR_RE.test(name)) {
    return null;
  }
  if (typeof raw.installs !== 'number' || !Number.isFinite(raw.installs) || raw.installs < 0) {
    return null;
  }

  /** @type {Record<string, unknown>} */
  const item = {
    source,
    skillId,
    name,
    installs: Math.trunc(raw.installs),
  };

  if (Array.isArray(raw.weeklyInstalls)) {
    const weekly = [];
    for (const point of raw.weeklyInstalls) {
      if (weekly.length >= MAX_WEEKLY_POINTS) break;
      if (typeof point === 'number' && Number.isFinite(point) && point >= 0) {
        weekly.push(Math.trunc(point));
      }
    }
    if (weekly.length > 0) {
      item.weeklyInstalls = weekly;
    }
  }

  if (
    typeof raw.installsYesterday === 'number' &&
    Number.isFinite(raw.installsYesterday) &&
    raw.installsYesterday >= 0
  ) {
    item.installsYesterday = Math.trunc(raw.installsYesterday);
  }

  if (typeof raw.change === 'number' && Number.isFinite(raw.change)) {
    item.change = Math.trunc(raw.change);
  }

  if (typeof raw.isOfficial === 'boolean') {
    item.isOfficial = raw.isOfficial;
  }

  return item;
}

/**
 * Descarga y valida la página 0 de una vista de skills.sh.
 * @param {'all-time' | 'trending' | 'hot'} view
 */
async function fetchViewSnapshot(view) {
  const url = `${UPSTREAM_ORIGIN}/api/skills/${view}/0`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al consultar ${url}`);
    }

    const contentLength = Number(response.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      throw new Error(`Respuesta demasiado grande (${contentLength} bytes) en ${url}`);
    }

    const rawText = await response.text();
    if (Buffer.byteLength(rawText, 'utf8') > MAX_RESPONSE_BYTES) {
      throw new Error(`Respuesta supera el límite de ${MAX_RESPONSE_BYTES} bytes en ${url}`);
    }

    const data = JSON.parse(rawText);
    if (!data || typeof data !== 'object' || !Array.isArray(data.skills)) {
      throw new Error(`Formato JSON inesperado en ${url}`);
    }

    const skills = [];
    for (const rawItem of data.skills) {
      if (skills.length >= MAX_SKILLS_PER_VIEW) break;
      const clean = sanitizeSkillItem(rawItem);
      if (clean) skills.push(clean);
    }

    if (skills.length === 0) {
      throw new Error(`La vista "${view}" devolvió 0 skills válidas`);
    }

    const total =
      typeof data.total === 'number' && Number.isFinite(data.total) && data.total >= skills.length
        ? Math.trunc(data.total)
        : skills.length;

    return { total, skills };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const results = await Promise.all(VIEWS.map((view) => fetchViewSnapshot(view)));

  const snapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: UPSTREAM_ORIGIN,
    views: {
      'all-time': results[0],
      trending: results[1],
      hot: results[2],
    },
  };

  const payload = `${JSON.stringify(snapshot)}\n`;
  const outputDir = path.dirname(OUTPUT_PATH);
  const tempPath = `${OUTPUT_PATH}.tmp`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(tempPath, payload, 'utf8');
  await rename(tempPath, OUTPUT_PATH);

  const sizeKb = (Buffer.byteLength(payload, 'utf8') / 1024).toFixed(1);
  console.log(
    `Snapshot skills.sh actualizado en ${path.relative(process.cwd(), OUTPUT_PATH)} (${sizeKb} KB): ` +
      VIEWS.map((view, i) => `${view}=${results[i].skills.length}/${results[i].total}`).join(', ')
  );
}

main().catch((err) => {
  console.error('Error al sincronizar el snapshot de skills.sh:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
