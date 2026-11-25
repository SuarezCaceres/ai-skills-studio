// Pruebas unitarias del proxy serverless api/skills-sh.ts (C1).
// Uso: node scripts/test-skills-sh-proxy.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'skills-sh-proxy-'));
const out = join(dir, 'skills-sh.mjs');

const ALLOWED_ORIGIN = 'https://suarezcaceres.github.io';
const OTHER_ORIGIN = 'https://evil.example.com';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${name}\n       ${err?.stack ?? err}`);
    process.exitCode = 1;
  }
}

function makeRequest(pathAndQuery, { method = 'GET', origin = ALLOWED_ORIGIN } = {}) {
  const headers = new Headers();
  if (origin !== null) {
    headers.set('Origin', origin);
  }
  return new Request(`https://proxy.example.test/api/skills-sh${pathAndQuery}`, {
    method,
    headers,
  });
}

try {
  await build({
    entryPoints: [join(ROOT, 'api/skills-sh.ts')],
    outfile: out,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'error',
  });

  const { handleSkillsShRequest } = await import(pathToFileURL(out).href);

  console.log('api/skills-sh.ts — CORS y métodos');

  await test('OPTIONS con origen permitido devuelve 204 y cabeceras CORS', async () => {
    // Arrange
    let fetchCalled = false;
    const req = makeRequest('', { method: 'OPTIONS', origin: ALLOWED_ORIGIN });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN, 'http://localhost:5173'],
      fetchImpl: async () => {
        fetchCalled = true;
        throw new Error('no debe invocar fetch');
      },
    });

    // Assert
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), ALLOWED_ORIGIN);
    assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
    assert.match(res.headers.get('Vary') ?? '', /\bOrigin\b/);
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(fetchCalled, false);
  });

  await test('OPTIONS con origen no permitido devuelve 403 sin ACAO', async () => {
    // Arrange
    const req = makeRequest('', { method: 'OPTIONS', origin: OTHER_ORIGIN });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 403);
    assert.deepEqual(body, { error: 'origin_not_allowed' });
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
  });

  await test('GET sin cabecera Origin devuelve 403 origin_not_allowed', async () => {
    // Arrange
    let fetchCalled = false;
    const req = makeRequest('?mode=list&view=all-time&page=0', { origin: null });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response('{}', { status: 200 });
      },
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 403);
    assert.deepEqual(body, { error: 'origin_not_allowed' });
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(fetchCalled, false);
  });

  await test('GET del mismo origen (sin Origin pero con Sec-Fetch-Site: same-origin) devuelve 200', async () => {
    // Arrange
    const req = new Request('https://codice-oauth.vercel.app/api/skills-sh?mode=list&view=all-time&page=0', {
      method: 'GET',
      headers: {
        Host: 'codice-oauth.vercel.app',
        'Sec-Fetch-Site': 'same-origin',
      },
    });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: ['https://codice-oauth.vercel.app'],
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            skills: [{ source: 'vercel-labs/skills', skillId: 'find-skills', name: 'find-skills', installs: 100 }],
            total: 1,
            hasMore: false,
          }),
          { status: 200 }
        ),
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 200);
    assert.equal(body.skills.length, 1);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://codice-oauth.vercel.app');
  });

  await test('GET sin Origin con Sec-Fetch-Site distinto de same-origin devuelve 403', async () => {
    // Arrange
    let fetchCalled = false;
    const req = new Request('https://codice-oauth.vercel.app/api/skills-sh?mode=list&view=all-time&page=0', {
      method: 'GET',
      headers: {
        Host: 'codice-oauth.vercel.app',
        'Sec-Fetch-Site': 'none',
      },
    });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: ['https://codice-oauth.vercel.app'],
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response('{}', { status: 200 });
      },
    });

    // Assert
    assert.equal(res.status, 403);
    assert.equal(fetchCalled, false);
  });

  await test('GET con Origin ajeno devuelve 403 origin_not_allowed sin ACAO', async () => {
    // Arrange
    let fetchCalled = false;
    const req = makeRequest('?mode=list&view=all-time&page=0', { origin: OTHER_ORIGIN });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response('{}', { status: 200 });
      },
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 403);
    assert.deepEqual(body, { error: 'origin_not_allowed' });
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(fetchCalled, false);
  });

  await test('POST devuelve 405 method_not_allowed sin llamar upstream', async () => {
    // Arrange
    let fetchCalled = false;
    const req = makeRequest('?mode=list&view=all-time&page=0', { method: 'POST' });

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response('{}', { status: 200 });
      },
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 405);
    assert.deepEqual(body, { error: 'method_not_allowed' });
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.equal(fetchCalled, false);
  });

  console.log('api/skills-sh.ts — Validación anti-SSRF (400)');

  const invalidCases = [
    { label: 'mode ausente', query: '', expectedError: 'invalid_mode' },
    { label: 'mode inválido', query: '?mode=proxy&view=all-time', expectedError: 'invalid_mode' },
    { label: 'view=official no permitido', query: '?mode=list&view=official&page=0', expectedError: 'invalid_view' },
    { label: 'view con path traversal ../admin', query: '?mode=list&view=../admin&page=0', expectedError: 'invalid_view' },
    { label: 'page negativa (-1)', query: '?mode=list&view=all-time&page=-1', expectedError: 'invalid_page' },
    { label: 'page por encima del máximo (51)', query: '?mode=list&view=all-time&page=51', expectedError: 'invalid_page' },
    { label: 'page no numérica (abc)', query: '?mode=list&view=all-time&page=abc', expectedError: 'invalid_page' },
    { label: 'q ausente en search', query: '?mode=search', expectedError: 'invalid_query' },
    { label: 'q vacío (solo espacios)', query: '?mode=search&q=%20%20%20', expectedError: 'invalid_query' },
    { label: 'q mayor de 80 caracteres', query: `?mode=search&q=${'a'.repeat(81)}`, expectedError: 'invalid_query' },
    { label: 'q con carácter de control (LF)', query: '?mode=search&q=react%0Aevil', expectedError: 'invalid_query' },
    { label: 'q con carácter nulo (NUL)', query: '?mode=search&q=react%00', expectedError: 'invalid_query' },
    { label: 'limit=0 fuera de rango', query: '?mode=search&q=react&limit=0', expectedError: 'invalid_limit' },
    { label: 'limit=51 fuera de rango', query: '?mode=search&q=react&limit=51', expectedError: 'invalid_limit' },
    { label: 'limit no numérico', query: '?mode=search&q=react&limit=xyz', expectedError: 'invalid_limit' },
  ];

  for (const tc of invalidCases) {
    await test(`rechaza ${tc.label} con 400 ${tc.expectedError} y nunca llama fetchImpl`, async () => {
      // Arrange
      let fetchCalls = 0;
      const req = makeRequest(tc.query);

      // Act
      const res = await handleSkillsShRequest(req, {
        allowedOrigins: [ALLOWED_ORIGIN],
        fetchImpl: async () => {
          fetchCalls++;
          return new Response('{}', { status: 200 });
        },
      });
      const body = await res.json();

      // Assert
      assert.equal(res.status, 400);
      assert.deepEqual(body, { error: tc.expectedError });
      assert.equal(res.headers.get('Cache-Control'), 'no-store');
      assert.equal(fetchCalls, 0);
    });
  }

  console.log('api/skills-sh.ts — Listado y búsqueda válidos (200)');

  await test('mode=list&view=all-time&page=0 llama URL exacta, sanea entradas y aplica caché Edge', async () => {
    // Arrange
    const calls = [];
    const upstreamPayload = {
      skills: [
        {
          source: ' vercel-labs/agent-skills ',
          skillId: ' vercel-react-best-practices ',
          name: ' vercel-react-best-practices ',
          installs: 928903.9,
          weeklyInstalls: [10, 20.8, -5, 'bad', 30],
          installsYesterday: 120.4,
          change: 15.7,
          isOfficial: true,
          extraSecretField: 'must-be-dropped',
        },
        {
          source: 'uizze.sh',
          skillId: 'ui-taste',
          name: 'ui-taste',
          installs: 1002,
        },
        // Malformadas o peligrosas: deben descartarse
        { source: 'bad\nrepo', skillId: 'ok', name: 'ok', installs: 10 },
        { source: 'bad repo', skillId: 'ok', name: 'ok', installs: 10 },
        { source: 'ok/repo', skillId: 'bad\u0000id', name: 'ok', installs: 10 },
        { source: 'ok/repo', skillId: 'ok', name: 'bad\rname', installs: 10 },
        { source: 'ok/repo', skillId: 'ok', name: 'neg', installs: -1 },
        { source: 123, skillId: 'ok', name: 'bad-type', installs: 5 },
        null,
      ],
      total: 9905,
      hasMore: true,
    };

    const req = makeRequest('?mode=list&view=all-time&page=0');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify(upstreamPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });
    const body = await res.json();

    // Assert
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://www.skills.sh/api/skills/all-time/0');
    assert.equal(calls[0].init.method, 'GET');
    assert.equal(calls[0].init.redirect, 'error');

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'public, s-maxage=300, stale-while-revalidate=3600');
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.match(res.headers.get('Vary') ?? '', /\bOrigin\b/);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), ALLOWED_ORIGIN);

    assert.equal(body.mode, 'list');
    assert.equal(body.view, 'all-time');
    assert.equal(body.page, 0);
    assert.equal(body.total, 9905);
    assert.equal(body.hasMore, true);
    assert.ok(!Number.isNaN(Date.parse(body.syncedAt)));
    assert.equal(body.skills.length, 2);
    assert.deepEqual(body.skills[0], {
      source: 'vercel-labs/agent-skills',
      skillId: 'vercel-react-best-practices',
      name: 'vercel-react-best-practices',
      installs: 928903,
      weeklyInstalls: [10, 20, 30],
      installsYesterday: 120,
      change: 15,
      isOfficial: true,
    });
    assert.equal('extraSecretField' in body.skills[0], false);
    assert.deepEqual(body.skills[1], {
      source: 'uizze.sh',
      skillId: 'ui-taste',
      name: 'ui-taste',
      installs: 1002,
    });
  });

  await test('mode=search&q=react&limit=5 llama URL exacta y devuelve respuesta saneada', async () => {
    // Arrange
    const calls = [];
    const req = makeRequest('?mode=search&q=react&limit=5');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async (url) => {
        calls.push(String(url));
        return new Response(
          JSON.stringify({
            skills: [
              {
                source: 'vercel-labs/agent-skills',
                skillId: 'vercel-react-best-practices',
                name: 'vercel-react-best-practices',
                installs: 928903,
                isOfficial: true,
              },
              {
                source: 'bad/source',
                skillId: 'bad',
                name: 'with\u0007bell',
                installs: 10,
              },
            ],
            count: 42,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
    });
    const body = await res.json();

    // Assert
    assert.deepEqual(calls, ['https://www.skills.sh/api/search?q=react&limit=5']);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'public, s-maxage=300, stale-while-revalidate=3600');
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.match(res.headers.get('Vary') ?? '', /\bOrigin\b/);
    assert.equal(body.mode, 'search');
    assert.equal(body.query, 'react');
    assert.equal(body.count, 42);
    assert.equal(body.skills.length, 1);
    assert.equal(body.skills[0].skillId, 'vercel-react-best-practices');
  });

  console.log('api/skills-sh.ts — Fallos de upstream (502)');

  await test('upstream con HTTP 503 devuelve 502 sin filtrar detalles internos', async () => {
    // Arrange
    const req = makeRequest('?mode=list&view=trending&page=0');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => new Response('INTERNAL_DB_PASSWORD=secret', { status: 503 }),
    });
    const raw = await res.text();

    // Assert
    assert.equal(res.status, 502);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(JSON.parse(raw), { error: 'upstream_unavailable' });
    assert.equal(raw.includes('INTERNAL_DB_PASSWORD'), false);
  });

  await test('error de red en fetchImpl devuelve 502 sin filtrar traza', async () => {
    // Arrange
    const req = makeRequest('?mode=list&view=hot&page=1');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => {
        throw new Error('connect ECONNREFUSED 10.20.30.40:443');
      },
    });
    const raw = await res.text();

    // Assert
    assert.equal(res.status, 502);
    assert.deepEqual(JSON.parse(raw), { error: 'upstream_unavailable' });
    assert.equal(raw.includes('ECONNREFUSED'), false);
  });

  await test('payload upstream > 1 MB (por cuerpo real) devuelve 502', async () => {
    // Arrange
    const oversized = JSON.stringify({
      skills: [{ source: 'a/b', skillId: 'x', name: 'x', installs: 1 }],
      pad: 'A'.repeat(1024 * 1024 + 128),
    });
    const req = makeRequest('?mode=list&view=all-time&page=0');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => new Response(oversized, { status: 200 }),
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 502);
    assert.deepEqual(body, { error: 'upstream_unavailable' });
  });

  await test('payload upstream > 1 MB (por Content-Length) devuelve 502', async () => {
    // Arrange
    const req = makeRequest('?mode=list&view=all-time&page=0');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () =>
        new Response('{"skills":[]}', {
          status: 200,
          headers: { 'Content-Length': String(1024 * 1024 + 1) },
        }),
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 502);
    assert.deepEqual(body, { error: 'upstream_unavailable' });
  });

  await test('upstream con JSON sin array skills devuelve 502', async () => {
    // Arrange
    const req = makeRequest('?mode=search&q=react&limit=5');

    // Act
    const res = await handleSkillsShRequest(req, {
      allowedOrigins: [ALLOWED_ORIGIN],
      fetchImpl: async () => new Response(JSON.stringify({ wrong: true }), { status: 200 }),
    });
    const body = await res.json();

    // Assert
    assert.equal(res.status, 502);
    assert.deepEqual(body, { error: 'upstream_unavailable' });
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} pruebas correctas${failed ? `, ${failed} fallaron` : ''}`);
if (failed > 0) process.exit(1);
