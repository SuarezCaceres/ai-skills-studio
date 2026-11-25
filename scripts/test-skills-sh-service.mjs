// Pruebas de integración en Node para skillsShService y puente GitHub (C2 y C3).
// Uso: node scripts/test-skills-sh-service.mjs
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'skills-sh-service-'));
const entry = join(dir, 'entry.ts');
const out = join(dir, 'bundle.mjs');

writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(ROOT, 'src/services/skillsShService.ts').replace(/\\/g, '/'))};
export { createGithubCatalogService, CatalogError } from ${JSON.stringify(join(ROOT, 'src/services/githubCatalogService.ts').replace(/\\/g, '/'))};
`
);

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

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SAMPLE_SNAPSHOT = {
  version: 1,
  generatedAt: '2026-11-20T10:00:00.000Z',
  source: 'https://www.skills.sh',
  views: {
    'all-time': {
      total: 3,
      skills: [
        {
          source: 'vercel-labs/agent-skills',
          skillId: 'vercel-react-best-practices',
          name: 'vercel-react-best-practices',
          installs: 920000,
          isOfficial: true,
        },
        {
          source: 'uizze.sh',
          skillId: 'ui-taste',
          name: 'ui-taste',
          installs: 500000,
        },
        {
          source: 'mattpocock/skills',
          skillId: 'tdd',
          name: 'tdd',
          installs: 300000,
        },
      ],
    },
    trending: {
      total: 2,
      skills: [
        // Duplicada con más instalaciones para comprobar deduplicación al buscar
        {
          source: 'vercel-labs/agent-skills',
          skillId: 'vercel-react-best-practices',
          name: 'vercel-react-best-practices',
          installs: 950000,
          isOfficial: true,
        },
        {
          source: 'acme/react-pack',
          skillId: 'react-hooks-guide',
          name: 'react-hooks-guide',
          installs: 120000,
        },
      ],
    },
    hot: {
      total: 1,
      skills: [
        {
          source: 'uizze.sh',
          skillId: 'ui-taste',
          name: 'ui-taste',
          installs: 1000,
          change: 400,
        },
      ],
    },
  },
};

try {
  await build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    format: 'esm',
    platform: 'node',
    nodePaths: [join(ROOT, 'node_modules')],
    define: {
      'import.meta.env': JSON.stringify({ BASE_URL: './', VITE_CATALOG_REPO: 'test/catalog' }),
    },
    logLevel: 'error',
  });

  const m = await import(pathToFileURL(out).href);

  /* ---------------------------------------------------------------- */
  /* 1. Helpers puros de skillsShService (C2)                         */
  /* ---------------------------------------------------------------- */
  console.log('skillsShService — Helpers puros');

  await test('isGithubSource acepta owner/repo válidos y rechaza .well-known o rutas inseguras', () => {
    assert.equal(m.isGithubSource('vercel-labs/agent-skills'), true);
    assert.equal(m.isGithubSource('octo/skill.v2_beta'), true);
    assert.equal(m.isGithubSource('uizze.sh'), false);
    assert.equal(m.isGithubSource('open.feishu.cn'), false);
    assert.equal(m.isGithubSource('a/b/c'), false);
    assert.equal(m.isGithubSource('../evil'), false);
    assert.equal(m.isGithubSource('owner/..'), false);
    assert.equal(m.isGithubSource('owner/.'), false);
    assert.equal(m.isGithubSource('-bad/repo'), false);
    assert.equal(m.isGithubSource(''), false);
  });

  await test('buildNpxInstallCommand acepta identificadores seguros (incluyendo :: y .) y rechaza inyección de shell', () => {
    assert.equal(
      m.buildNpxInstallCommand('vercel-labs/agent-skills', 'vercel-react-best-practices'),
      'npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices'
    );
    assert.equal(
      m.buildNpxInstallCommand('google-labs-code/stitch-skills', 'stitch::extract-design-md'),
      'npx skills add google-labs-code/stitch-skills --skill stitch::extract-design-md'
    );
    assert.equal(
      m.buildNpxInstallCommand('uizze.sh', 'ui.taste'),
      'npx skills add uizze.sh --skill ui.taste'
    );

    const maliciousPairs = [
      ['vercel/skills; rm -rf /', 'valid'],
      ['vercel/skills', 'x; rm -rf /'],
      ['vercel/skills', '$(id)'],
      ['$(whoami)/repo', 'ok'],
      ['vercel/../evil', 'ok'],
      ['vercel/skills', '../escape'],
      ['vercel/skills', 'has space'],
      ['vercel/skills', 'quote"test'],
      ['vercel/skills', "quote'test"],
      ['vercel/skills', '--flag'],
      ['--flag', 'ok'],
      ['vercel/skills', 'a\nb'],
      ['vercel//skills', 'ok'],
    ];
    for (const [source, skillId] of maliciousPairs) {
      assert.equal(
        m.buildNpxInstallCommand(source, skillId),
        '',
        `Debió rechazar source=${JSON.stringify(source)} skillId=${JSON.stringify(skillId)}`
      );
    }
  });

  await test('normalizeSkillsShItem sanea texto, construye URLs y descarta inválidos', () => {
    // Arrange & Act
    const gh = m.normalizeSkillsShItem({
      source: ' vercel-labs/agent-skills\n',
      skillId: 'vercel-react-best-practices\t',
      name: 'React\u0000 Best Practices',
      installs: 4200,
      weeklyInstalls: [10, -1, 20],
      installsYesterday: 50,
      change: 12,
      isOfficial: true,
    });
    const wellKnown = m.normalizeSkillsShItem({
      source: 'uizze.sh',
      skillId: 'ui-taste',
      name: '',
      installs: 150,
    });

    // Assert
    assert.ok(gh);
    assert.equal(gh.id, 'vercel-labs/agent-skills/vercel-react-best-practices');
    assert.equal(gh.name, 'React Best Practices');
    assert.equal(gh.isGithubSource, true);
    assert.equal(gh.isOfficial, true);
    assert.equal(gh.githubUrl, 'https://github.com/vercel-labs/agent-skills');
    assert.equal(
      gh.skillsShUrl,
      'https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices'
    );
    assert.deepEqual(gh.weeklyInstalls, [10, 20]);
    assert.equal(
      gh.installCommand,
      'npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices'
    );

    assert.ok(wellKnown);
    assert.equal(wellKnown.name, 'ui-taste');
    assert.equal(wellKnown.isGithubSource, false);
    assert.equal(wellKnown.githubUrl, undefined);
    assert.equal(wellKnown.skillsShUrl, 'https://www.skills.sh/uizze.sh/ui-taste');

    assert.equal(m.normalizeSkillsShItem(null), null);
    assert.equal(m.normalizeSkillsShItem({ source: '', skillId: 'a', name: 'a', installs: 1 }), null);
    assert.equal(m.normalizeSkillsShItem({ source: 'a/b', skillId: 'a', name: 'a', installs: -5 }), null);
    assert.equal(m.normalizeSkillsShItem({ source: 'a/b', skillId: 'a', name: 'a', installs: 1.5 }), null);
  });

  await test('resolveDefaultProxyUrl prioriza VITE_SKILLS_SH_PROXY_URL, deriva de OAuth y rechaza esquemas inseguros', () => {
    assert.equal(
      m.resolveDefaultProxyUrl({
        VITE_SKILLS_SH_PROXY_URL: 'https://custom.example.test/api/skills-sh/',
        VITE_GITHUB_OAUTH_URL: 'https://oauth.example.test/api/github-oauth',
      }),
      'https://custom.example.test/api/skills-sh'
    );
    assert.equal(
      m.resolveDefaultProxyUrl({
        VITE_GITHUB_OAUTH_URL: 'https://oauth.example.test/api/github-oauth',
      }),
      'https://oauth.example.test/api/skills-sh'
    );
    assert.equal(
      m.resolveDefaultProxyUrl({
        VITE_SKILLS_SH_PROXY_URL: 'http://localhost:3000/api/skills-sh',
      }),
      'http://localhost:3000/api/skills-sh'
    );
    assert.equal(
      m.resolveDefaultProxyUrl({
        VITE_SKILLS_SH_PROXY_URL: 'javascript:alert(1)',
        VITE_GITHUB_OAUTH_URL: 'http://evil.com/api/github-oauth',
      }),
      ''
    );
    assert.equal(
      m.resolveDefaultProxyUrl({
        VITE_SKILLS_SH_PROXY_URL: 'https://user:pass@proxy.example.test/api/skills-sh',
      }),
      ''
    );
  });

  /* ---------------------------------------------------------------- */
  /* 2. Flujos híbridos de createSkillsShService (C2)                 */
  /* ---------------------------------------------------------------- */
  console.log('skillsShService — Flujos híbridos (live → caché → snapshot)');

  await test('list() en vivo guarda en SKILLS_SH_CACHE_KEY y la segunda llamada sirve caché dentro del TTL sin red', async () => {
    // Arrange
    let clock = 1_700_000_000_000;
    const storage = createMemoryStorage();
    const fetchCalls = [];
    const service = m.createSkillsShService({
      proxyUrl: 'https://proxy.test/api/skills-sh',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage,
      now: () => clock,
      ttlMs: 60_000,
      fetchImpl: async (url) => {
        fetchCalls.push(String(url));
        return jsonResponse({
          mode: 'list',
          view: 'all-time',
          page: 0,
          skills: [
            {
              source: 'vercel-labs/skills',
              skillId: 'find-skills',
              name: 'find-skills',
              installs: 4500000,
              isOfficial: true,
            },
          ],
          total: 9900,
          hasMore: true,
          syncedAt: '2026-11-24T12:00:00.000Z',
        });
      },
    });

    // Act 1: en vivo
    const first = await service.list('all-time', 0);

    // Assert 1
    assert.equal(first.sourceMode, 'live');
    assert.equal(first.skills.length, 1);
    assert.equal(first.skills[0].skillId, 'find-skills');
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0], 'https://proxy.test/api/skills-sh?mode=list&view=all-time&page=0');
    assert.ok(storage.getItem(m.SKILLS_SH_CACHE_KEY)?.includes('find-skills'));

    // Act 2: dentro del TTL
    clock += 30_000;
    const second = await service.list('all-time', 0);

    // Assert 2
    assert.equal(second.sourceMode, 'cache');
    assert.equal(second.notice, undefined);
    assert.equal(second.skills[0].skillId, 'find-skills');
    assert.equal(fetchCalls.length, 1);
  });

  await test('si falla el proxy con caché expirada, degrada a caché con notice', async () => {
    // Arrange
    let clock = 1_700_000_000_000;
    let proxyDown = false;
    const storage = createMemoryStorage();
    const service = m.createSkillsShService({
      proxyUrl: 'https://proxy.test/api/skills-sh',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage,
      now: () => clock,
      ttlMs: 60_000,
      fetchImpl: async () => {
        if (proxyDown) return jsonResponse({ error: 'upstream_unavailable' }, 502);
        return jsonResponse({
          skills: [
            {
              source: 'vercel-labs/skills',
              skillId: 'find-skills',
              name: 'find-skills',
              installs: 1000,
              isOfficial: true,
            },
          ],
          total: 1,
          hasMore: false,
          syncedAt: '2026-11-24T12:00:00.000Z',
        });
      },
    });

    await service.list('all-time', 0);

    // Act: expira TTL y el proxy cae
    clock += 120_000;
    proxyDown = true;
    const degraded = await service.list('all-time', 0);

    // Assert
    assert.equal(degraded.sourceMode, 'cache');
    assert.equal(degraded.skills[0].skillId, 'find-skills');
    assert.ok(typeof degraded.notice === 'string' && degraded.notice.length > 0);
  });

  await test('si falla el proxy sin caché (o proxyUrl vacío), degrada a snapshotUrl', async () => {
    // Arrange: proxy caído sin caché
    const calls1 = [];
    const serviceDown = m.createSkillsShService({
      proxyUrl: 'https://proxy.test/api/skills-sh',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage: createMemoryStorage(),
      fetchImpl: async (url) => {
        const u = String(url);
        calls1.push(u);
        if (u.startsWith('https://proxy.test')) return jsonResponse({ error: 'down' }, 502);
        return jsonResponse(SAMPLE_SNAPSHOT);
      },
    });

    // Act 1
    const res1 = await serviceDown.list('all-time', 0);

    // Assert 1
    assert.equal(res1.sourceMode, 'snapshot');
    assert.equal(res1.syncedAt, SAMPLE_SNAPSHOT.generatedAt);
    assert.equal(res1.skills.length, 3);
    assert.ok(res1.notice && res1.notice.includes('copia de respaldo'));
    assert.equal(calls1.length, 2);

    // Arrange: proxyUrl vacío
    const calls2 = [];
    const serviceNoProxy = m.createSkillsShService({
      proxyUrl: '',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage: createMemoryStorage(),
      fetchImpl: async (url) => {
        calls2.push(String(url));
        return jsonResponse(SAMPLE_SNAPSHOT);
      },
    });

    // Act 2
    const res2 = await serviceNoProxy.list('trending', 0);

    // Assert 2
    assert.equal(res2.sourceMode, 'snapshot');
    assert.equal(res2.syncedAt, SAMPLE_SNAPSHOT.generatedAt);
    assert.equal(res2.skills.length, 2);
    assert.ok(res2.notice && res2.notice.includes('no configurado'));
    assert.deepEqual(calls2, ['https://app.test/data/skills-sh-snapshot.json']);
  });

  await test('search() en vivo consulta mode=search y degrada a búsqueda local deduplicada sobre snapshot', async () => {
    // Arrange
    let failProxy = false;
    const calls = [];
    const service = m.createSkillsShService({
      proxyUrl: 'https://proxy.test/api/skills-sh',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage: createMemoryStorage(),
      fetchImpl: async (url) => {
        const u = String(url);
        calls.push(u);
        if (u.startsWith('https://proxy.test')) {
          if (failProxy) throw new Error('network down');
          return jsonResponse({
            mode: 'search',
            query: 'react',
            skills: [
              {
                source: 'vercel-labs/agent-skills',
                skillId: 'vercel-react-best-practices',
                name: 'vercel-react-best-practices',
                installs: 928903,
                isOfficial: true,
              },
            ],
            count: 1,
            syncedAt: '2026-11-24T12:15:00.000Z',
          });
        }
        return jsonResponse(SAMPLE_SNAPSHOT);
      },
    });

    // Act 1: en vivo
    const live = await service.search('react', 10);

    // Assert 1
    assert.equal(live.sourceMode, 'live');
    assert.equal(live.query, 'react');
    assert.equal(live.skills.length, 1);
    assert.equal(calls[0], 'https://proxy.test/api/skills-sh?mode=search&q=react&limit=10');

    // Act 2: proxy cae → búsqueda local deduplicada sobre snapshot
    failProxy = true;
    const fallback = await service.search('react', 10);

    // Assert 2: `vercel-react-best-practices` aparece en all-time (920000) y trending (950000), debe quedar una sola vez con 950000
    assert.equal(fallback.sourceMode, 'snapshot');
    assert.ok(fallback.notice && fallback.notice.length > 0);
    assert.equal(fallback.skills.length, 2);
    assert.equal(fallback.skills[0].skillId, 'vercel-react-best-practices');
    assert.equal(fallback.skills[0].installs, 950000);
    assert.equal(fallback.skills[1].skillId, 'react-hooks-guide');
  });

  await test('storage corrupto no rompe list() ni search()', async () => {
    // Arrange
    const corruptStorage = createMemoryStorage({
      [m.SKILLS_SH_CACHE_KEY]: '{not-valid-json[[[',
    });
    const service = m.createSkillsShService({
      proxyUrl: '',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage: corruptStorage,
      fetchImpl: async () => jsonResponse(SAMPLE_SNAPSHOT),
    });

    // Act
    const listed = await service.list('all-time', 0);
    const searched = await service.search('tdd', 5);

    // Assert
    assert.equal(listed.sourceMode, 'snapshot');
    assert.equal(listed.skills.length, 3);
    assert.equal(searched.sourceMode, 'snapshot');
    assert.equal(searched.skills.length, 1);
    assert.equal(searched.skills[0].skillId, 'tdd');
  });

  await test('cuando falla el proxy remoto y hay devProxyFallbackUrl local, responde en vivo sin caer a snapshot', async () => {
    // Arrange
    const calls = [];
    const service = m.createSkillsShService({
      proxyUrl: 'https://proxy.test/api/skills-sh',
      devProxyFallbackUrl: '/api/skills-sh',
      snapshotUrl: 'https://app.test/data/skills-sh-snapshot.json',
      storage: createMemoryStorage(),
      fetchImpl: async (url) => {
        const u = String(url);
        calls.push(u);
        if (u.startsWith('https://proxy.test/')) {
          return jsonResponse({ error: 'not_found' }, 404);
        }
        if (u.startsWith('/api/skills-sh?')) {
          return jsonResponse({
            mode: 'list',
            view: 'all-time',
            page: 0,
            skills: [
              {
                source: 'vercel-labs/skills',
                skillId: 'find-skills',
                name: 'find-skills',
                installs: 4514851,
                isOfficial: true,
              },
            ],
            total: 9905,
            hasMore: true,
            syncedAt: '2026-11-24T12:00:00.000Z',
          });
        }
        return jsonResponse(SAMPLE_SNAPSHOT);
      },
    });

    // Act
    const res = await service.list('all-time', 0);

    // Assert
    assert.equal(res.sourceMode, 'live');
    assert.equal(res.skills[0].skillId, 'find-skills');
    assert.deepEqual(calls, [
      'https://proxy.test/api/skills-sh?mode=list&view=all-time&page=0',
      '/api/skills-sh?mode=list&view=all-time&page=0',
    ]);
  });

  /* ---------------------------------------------------------------- */
  /* 3. Puente GitHub: inspectGithubSkillByHint y getGithubFileAtSha  */
  /* ---------------------------------------------------------------- */
  console.log('githubCatalogService — Puente skills.sh (C3)');

  const realFetch = globalThis.fetch;
  try {
    const SHA_ONE = '1'.repeat(40);
    const SHA_MULTI = '2'.repeat(40);
    const SHA_STITCH = '3'.repeat(40);
    const SHA_FM = '4'.repeat(40);
    const SHA_AMBIG = '5'.repeat(40);

    const mockRepos = {
      'octo/one-skill': {
        defaultBranch: 'main',
        sha: SHA_ONE,
        files: {
          'SKILL.md': '---\nname: one-skill\ndescription: Single skill repo.\n---\n# One Skill\n',
          'references/notes.md': 'Reference notes content.',
        },
      },
      'vercel-labs/agent-skills': {
        defaultBranch: 'main',
        sha: SHA_MULTI,
        files: {
          'skills/vercel-react-best-practices/SKILL.md':
            '---\nname: vercel-react-best-practices\ndescription: React best practices.\n---\n# React\n',
          'skills/vercel-react-best-practices/references/rules.md': 'Use memo sparingly.',
          'skills/web-design-guidelines/SKILL.md':
            '---\nname: web-design-guidelines\ndescription: Design guidelines.\n---\n# Design\n',
        },
      },
      'google-labs-code/stitch-skills': {
        defaultBranch: 'main',
        sha: SHA_STITCH,
        files: {
          'skills/extract-design-md/SKILL.md':
            '---\nname: extract-design-md\ndescription: Extract design tokens.\n---\n# Stitch\n',
          'skills/other-skill/SKILL.md':
            '---\nname: other-skill\ndescription: Other.\n---\n# Other\n',
        },
      },
      'acme/frontmatter-match': {
        defaultBranch: 'main',
        sha: SHA_FM,
        files: {
          'pack-alpha/SKILL.md':
            '---\nname: unrelated-alpha\ndescription: Alpha.\n---\n# Alpha\n',
          'pack-beta/SKILL.md':
            '---\nname: custom-target-skill\ndescription: Matched by frontmatter name.\n---\n# Beta\n',
        },
      },
      'acme/ambiguous-pack': {
        defaultBranch: 'main',
        sha: SHA_AMBIG,
        files: {
          'first/SKILL.md': '---\nname: first-one\ndescription: First.\n---\n# First\n',
          'second/SKILL.md': '---\nname: second-one\ndescription: Second.\n---\n# Second\n',
        },
      },
    };

    const rawFetchRequests = [];

    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      if (url.origin !== 'https://api.github.com') {
        throw new Error(`Fuga de red inesperada en prueba: ${url.toString()}`);
      }
      const p = url.pathname;
      const mRepo = /^\/repos\/([^/]+)\/([^/]+)$/.exec(p);
      if (mRepo) {
        const key = `${mRepo[1]}/${mRepo[2]}`;
        const repo = mockRepos[key];
        if (!repo) return jsonResponse({ message: 'Not Found' }, 404);
        return jsonResponse({
          private: false,
          default_branch: repo.defaultBranch,
          topics: ['skills'],
          license: { spdx_id: 'MIT' },
          owner: { login: mRepo[1] },
        });
      }
      const mCommit = /^\/repos\/([^/]+)\/([^/]+)\/commits\/(.+)$/.exec(p);
      if (mCommit) {
        const key = `${mCommit[1]}/${mCommit[2]}`;
        const repo = mockRepos[key];
        if (!repo) return jsonResponse({ message: 'Not Found' }, 404);
        return new Response(repo.sha, { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      const mTree = /^\/repos\/([^/]+)\/([^/]+)\/git\/trees\/([0-9a-f]{40})$/.exec(p);
      if (mTree) {
        const key = `${mTree[1]}/${mTree[2]}`;
        const repo = mockRepos[key];
        if (!repo || repo.sha !== mTree[3]) return jsonResponse({ message: 'Not Found' }, 404);
        return jsonResponse({
          tree: Object.entries(repo.files).map(([filePath, content]) => ({
            path: filePath,
            type: 'blob',
            mode: '100644',
            size: content.length,
          })),
        });
      }
      const mContents = /^\/repos\/([^/]+)\/([^/]+)\/contents\/(.+)$/.exec(p);
      if (mContents) {
        const key = `${mContents[1]}/${mContents[2]}`;
        const filePath = decodeURIComponent(mContents[3]);
        const ref = url.searchParams.get('ref');
        rawFetchRequests.push({ key, filePath, ref });
        const repo = mockRepos[key];
        if (!repo || ref !== repo.sha || !(filePath in repo.files)) {
          return jsonResponse({ message: 'Not Found' }, 404);
        }
        return new Response(repo.files[filePath], {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      return jsonResponse({ message: 'Not Found' }, 404);
    };

    const catalog = m.createGithubCatalogService({
      catalogRepo: 'test/catalog',
      getSession: () => null,
    });

    await test('inspectGithubSkillByHint rechaza fuente .well-known con CatalogError invalid_url', async () => {
      await assert.rejects(
        () => catalog.inspectGithubSkillByHint('uizze.sh', 'ui-taste'),
        (err) => err instanceof m.CatalogError && err.code === 'invalid_url'
      );
      await assert.rejects(
        () => catalog.inspectGithubSkillByHint('a/b/c', 'skill'),
        (err) => err instanceof m.CatalogError && err.code === 'invalid_url'
      );
    });

    await test('inspectGithubSkillByHint resuelve repo mono-skill fijado a SHA', async () => {
      const resolved = await catalog.inspectGithubSkillByHint('octo/one-skill', 'anything');
      assert.equal(resolved.skill.repo, 'octo/one-skill');
      assert.equal(resolved.skill.skillPath, '');
      assert.equal(resolved.skill.commitSha, SHA_ONE);
      assert.equal(resolved.canonicalUrl, 'https://github.com/octo/one-skill');
      assert.ok(resolved.skill.markdown.includes('# One Skill'));
    });

    await test('inspectGithubSkillByHint resuelve repo multi-skill por skillId y devuelve canonicalUrl con carpeta', async () => {
      const resolved = await catalog.inspectGithubSkillByHint(
        'vercel-labs/agent-skills',
        'vercel-react-best-practices'
      );
      assert.equal(resolved.skill.repo, 'vercel-labs/agent-skills');
      assert.equal(resolved.skill.skillPath, 'skills/vercel-react-best-practices');
      assert.equal(resolved.skill.commitSha, SHA_MULTI);
      assert.equal(
        resolved.canonicalUrl,
        'https://github.com/vercel-labs/agent-skills/tree/main/skills/vercel-react-best-practices'
      );
      assert.ok(resolved.skill.markdown.includes('React best practices.'));
    });

    await test('inspectGithubSkillByHint resuelve skillId con prefijo stitch::extract-design-md', async () => {
      const resolved = await catalog.inspectGithubSkillByHint(
        'google-labs-code/stitch-skills',
        'stitch::extract-design-md'
      );
      assert.equal(resolved.skill.skillPath, 'skills/extract-design-md');
      assert.equal(resolved.skill.commitSha, SHA_STITCH);
      assert.equal(
        resolved.canonicalUrl,
        'https://github.com/google-labs-code/stitch-skills/tree/main/skills/extract-design-md'
      );
    });

    await test('inspectGithubSkillByHint desambigua por frontmatter.name cuando la carpeta no coincide', async () => {
      const resolved = await catalog.inspectGithubSkillByHint(
        'acme/frontmatter-match',
        'custom-target-skill'
      );
      assert.equal(resolved.skill.skillPath, 'pack-beta');
      assert.equal(resolved.skill.commitSha, SHA_FM);
      assert.equal(
        resolved.canonicalUrl,
        'https://github.com/acme/frontmatter-match/tree/main/pack-beta'
      );
    });

    await test('inspectGithubSkillByHint lanza ambiguous_skill si no hay coincidencia en repo multi-skill', async () => {
      await assert.rejects(
        () => catalog.inspectGithubSkillByHint('acme/ambiguous-pack', 'nonexistent-hint'),
        (err) => err instanceof m.CatalogError && err.code === 'ambiguous_skill'
      );
    });

    await test('getGithubFileAtSha lee contenido fijado a SHA y rechaza rutas con .. o SHA inválido', async () => {
      // Act: lectura válida en subcarpeta y en raíz
      const subContent = await catalog.getGithubFileAtSha(
        'vercel-labs/agent-skills',
        'skills/vercel-react-best-practices',
        'references/rules.md',
        SHA_MULTI
      );
      const rootContent = await catalog.getGithubFileAtSha(
        'octo/one-skill',
        '',
        'references/notes.md',
        SHA_ONE
      );

      // Assert lecturas válidas
      assert.equal(subContent, 'Use memo sparingly.');
      assert.equal(rootContent, 'Reference notes content.');
      assert.ok(
        rawFetchRequests.some(
          (r) =>
            r.key === 'vercel-labs/agent-skills' &&
            r.filePath === 'skills/vercel-react-best-practices/references/rules.md' &&
            r.ref === SHA_MULTI
        )
      );

      // Assert entradas rechazadas
      const badCalls = [
        () => catalog.getGithubFileAtSha('vercel-labs/agent-skills', 'skills/a', '../secret.md', SHA_MULTI),
        () => catalog.getGithubFileAtSha('vercel-labs/agent-skills', '../outside', 'SKILL.md', SHA_MULTI),
        () => catalog.getGithubFileAtSha('vercel-labs/agent-skills', 'skills/a', 'SKILL.md', 'not-a-sha'),
        () => catalog.getGithubFileAtSha('vercel-labs/agent-skills', 'skills/a', '/abs/path.md', SHA_MULTI),
        () => catalog.getGithubFileAtSha('uizze.sh', '', 'SKILL.md', SHA_MULTI),
      ];
      for (const invoke of badCalls) {
        await assert.rejects(
          invoke,
          (err) => err instanceof m.CatalogError && err.code === 'invalid_input'
        );
      }
    });
  } finally {
    globalThis.fetch = realFetch;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} pruebas correctas${failed ? `, ${failed} fallaron` : ''}`);
if (failed > 0) process.exit(1);
