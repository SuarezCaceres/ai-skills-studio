// Pruebas de la Fase 3: leer una skill local y publicarla en el repo de quien sube.
// Usa un GitHub simulado en memoria (nunca toca la red). Uso: node scripts/test-skill-upload.mjs
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'upload-'));
const entry = join(dir, 'entry.ts');
const out = join(dir, 'bundle.mjs');
const posix = (p) => join(ROOT, p).replace(/\\/g, '/');

writeFileSync(
  entry,
  `export * from ${JSON.stringify(posix('src/services/skillUploadService.ts'))};
export * from ${JSON.stringify(posix('src/services/teamStats.ts'))};
export { createGithubCatalogService, CatalogError } from ${JSON.stringify(posix('src/services/githubCatalogService.ts'))};
`
);
await build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env': '{"VITE_CATALOG_REPO":"test/catalog"}' },
  nodePaths: [join(ROOT, 'node_modules')],
  logLevel: 'error',
});
const m = await import(pathToFileURL(out).href);

let passed = 0;
const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
};
const f = (path, content) => ({ file: new File([content], path.split('/').pop()), relativePath: path });
const rejects = (promise, re) => assert.rejects(promise, (e) => e.name === 'UploadError' && re.test(e.message));

const MD = '---\nname: PDF Tools\ndescription: Works with PDFs.\n---\n\n# PDF Tools\n';

/* ===================================================================== */
console.log('readLocalSkill');

await test('un .md suelto se sube como SKILL.md y el nombre sale del frontmatter', async () => {
  const d = await m.readLocalSkill([f('mi-nota.md', MD)]);
  assert.deepEqual(d.files.map((x) => x.path), ['SKILL.md']);
  assert.equal(d.suggestedSlug, 'pdf-tools');
  assert.equal(d.name, 'PDF Tools');
  assert.equal(d.warnings.length, 0);
});

await test('un .md sin frontmatter usa el nombre del archivo y avisa', async () => {
  const d = await m.readLocalSkill([f('Mi Skill Genial.md', '# hola\n')]);
  assert.equal(d.suggestedSlug, 'mi-skill-genial');
  assert.ok(d.warnings.some((w) => w.includes('name')));
  assert.ok(d.warnings.some((w) => w.includes('description')));
});

await test('una carpeta: quita la carpeta raíz y deja SKILL.md primero', async () => {
  const d = await m.readLocalSkill([
    f('pdf/notes.md', 'x'),
    f('pdf/SKILL.md', MD),
    f('pdf/scripts/run.py', 'print(1)'),
  ]);
  assert.deepEqual(d.files.map((x) => x.path), ['SKILL.md', 'notes.md', 'scripts/run.py']);
  assert.ok(d.warnings.some((w) => w.includes('scripts')));
});

await test('si se elige una carpeta madre, usa la subcarpeta con SKILL.md y avisa de lo que queda fuera', async () => {
  const d = await m.readLocalSkill([f('proj/README.md', 'r'), f('proj/skills/pdf/SKILL.md', MD), f('proj/skills/pdf/a.md', 'a')]);
  assert.deepEqual(d.files.map((x) => x.path), ['SKILL.md', 'a.md']);
  assert.ok(d.warnings.some((w) => w.includes('fuera de la carpeta')));
});

await test('un skill.md en minúsculas se normaliza a SKILL.md', async () => {
  const d = await m.readLocalSkill([f('x/skill.md', MD)]);
  assert.equal(d.files[0].path, 'SKILL.md');
});

await test('ignora .git, node_modules y .env (este último con aviso)', async () => {
  const d = await m.readLocalSkill([
    f('s/SKILL.md', MD),
    f('s/.git/config', 'x'),
    f('s/node_modules/a/index.js', 'x'),
    f('s/.env.local', 'TOKEN=abc'),
  ]);
  assert.deepEqual(d.files.map((x) => x.path), ['SKILL.md']);
  assert.equal(d.ignored.length, 3);
  assert.ok(d.warnings.some((w) => w.includes('.env')));
});

await test('varios SKILL.md: error', () => rejects(m.readLocalSkill([f('a/SKILL.md', MD), f('b/SKILL.md', MD)]), /varios SKILL\.md/));
await test('sin SKILL.md: error', () => rejects(m.readLocalSkill([f('s/a.md', 'x'), f('s/b.md', 'y')]), /No encuentro un SKILL\.md/));
await test('SKILL.md vacío: error', () => rejects(m.readLocalSkill([f('s/SKILL.md', '   ')]), /vacío/));
await test('ruta con .. o absoluta: error', async () => {
  await rejects(m.readLocalSkill([f('../x/SKILL.md', MD)]), /no es válida/);
  await rejects(m.readLocalSkill([f('/etc/SKILL.md', MD)]), /no es válida/);
  await rejects(m.readLocalSkill([f('C:\\x\\SKILL.md', MD)]), /no es válida/);
});

await test('detiene una clave privada y no muestra su valor', async () => {
  const key = '-----BEGIN RSA PRIVATE KEY-----\nMIIsecretovalor\n-----END RSA PRIVATE KEY-----';
  await assert.rejects(m.readLocalSkill([f('s/SKILL.md', MD), f('s/id_rsa.md', key)]), (e) => {
    assert.match(e.message, /id_rsa\.md/);
    assert.match(e.message, /clave privada/);
    assert.ok(!e.message.includes('MIIsecretovalor'));
    return true;
  });
});
await test('detiene tokens de GitHub, AWS y claves sk-', async () => {
  await rejects(m.readLocalSkill([f('s/SKILL.md', MD + 'ghp_' + 'A'.repeat(36))]), /token de GitHub/);
  await rejects(m.readLocalSkill([f('s/SKILL.md', MD + 'AKIA' + 'B'.repeat(16))]), /AWS/);
  await rejects(m.readLocalSkill([f('s/SKILL.md', MD + 'sk-' + 'c'.repeat(40))]), /sk-/);
});
await test('no se marca texto normal como secreto', async () => {
  const d = await m.readLocalSkill([f('s/SKILL.md', MD + 'Usa `git push` y la variable GITHUB_TOKEN del entorno.\n')]);
  assert.equal(d.files.length, 1);
});

await test('un archivo demasiado grande: error con su nombre', () =>
  rejects(m.readLocalSkill([f('s/SKILL.md', MD), f('s/big.md', 'x'.repeat(1_000_001))]), /big\.md pesa/));
await test('demasiados archivos: error', () => {
  const many = [f('s/SKILL.md', MD), ...Array.from({ length: 50 }, (_, i) => f(`s/f${i}.md`, 'x'))];
  return rejects(m.readLocalSkill(many), /51 archivos/);
});
await test('el total no puede pasar de 5 MB', () => {
  const chunk = 'y'.repeat(900_000);
  return rejects(m.readLocalSkill([f('s/SKILL.md', MD), ...Array.from({ length: 6 }, (_, i) => f(`s/c${i}.md`, chunk))]), /5 MB/);
});

await test('un binario se sube sin escanearlo y su base64 decodifica igual', async () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 0, 1, 2, 255, 254]);
  const d = await m.readLocalSkill([
    { file: new File([MD], 'SKILL.md'), relativePath: 's/SKILL.md' },
    { file: new File([bytes], 'logo.png'), relativePath: 's/logo.png' },
  ]);
  const png = d.files.find((x) => x.path === 'logo.png');
  assert.deepEqual([...Buffer.from(png.base64, 'base64')], [...bytes]);
});

await test('slugify e isValidSlug', () => {
  assert.equal(m.slugify('Mi Skill Genial!'), 'mi-skill-genial');
  assert.equal(m.slugify('Diseño Rápido.md'), 'disenorapido'.replace('disenorapido', 'diseno-rapido'));
  assert.equal(m.slugify('---'), '');
  assert.equal(m.slugify('a'.repeat(100)).length, 64);
  assert.ok(m.isValidSlug('pdf-tools') && m.isValidSlug('a'));
  assert.ok(!m.isValidSlug('-x') && !m.isValidSlug('x-') && !m.isValidSlug('A') && !m.isValidSlug('a b') && !m.isValidSlug(''));
});

/* ===================================================================== */
console.log('publishLocalSkill (GitHub simulado)');

const SHA = (n) => n.toString(16).padStart(40, '0');

function makeGithub({ owner: OWNER, catalog, existingRepo = false, privateRepo = false, staleList = false }) {
  let counter = 1;
  const blobs = new Map(); // sha -> Buffer
  const trees = new Map(); // sha -> Map(path -> {sha})
  const commits = new Map(); // sha -> { tree }
  let repo = null;
  let head = null;
  const issues = [];
  const calls = [];
  const state = { failNextRefUpdate: false };

  const newTree = (entries) => {
    const sha = SHA(counter++);
    trees.set(sha, entries);
    return sha;
  };
  const makeRepo = () => {
    const blob = SHA(counter++);
    blobs.set(blob, Buffer.from('# codice-skills\n'));
    const tree = newTree(new Map([['README.md', { sha: blob }]]));
    head = SHA(counter++);
    commits.set(head, { tree });
    repo = { private: privateRepo, default_branch: 'main', topics: [], license: null, owner: { login: OWNER, avatar_url: 'https://avatars.githubusercontent.com/u/1' } };
  };
  if (existingRepo) makeRepo();

  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const notFound = () => json({ message: 'Not Found' }, 404);

  const fake = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body) : undefined;
    const p = decodeURIComponent(u.pathname);
    calls.push(`${method} ${p}`);
    const base = `/repos/${OWNER}/codice-skills`;

    if (p === base && method === 'GET') return repo ? json(repo) : notFound();
    if (p === `/users/${OWNER}`) {
      return json({
        login: OWNER,
        name: 'Alice Dev',
        avatar_url: 'https://avatars.githubusercontent.com/u/1',
        bio: 'Hago skills.',
        company: 'Códice',
        location: 'Quito',
        blog: 'alice.dev',
        public_repos: 7,
        followers: 3,
        created_at: '2020-01-01T00:00:00Z',
      });
    }
    if (p.startsWith('/users/')) return notFound();
    if (p === '/user/repos' && method === 'POST') {
      makeRepo();
      return json(repo, 201);
    }
    if (p === `${base}/git/ref/heads/main`) return json({ object: { sha: head } });
    if (p.startsWith(`${base}/git/commits/`) && method === 'GET') return json({ tree: { sha: commits.get(p.split('/').pop()).tree } });
    if (p === `${base}/git/blobs` && method === 'POST') {
      const sha = SHA(counter++);
      blobs.set(sha, Buffer.from(body.content, body.encoding === 'base64' ? 'base64' : 'utf8'));
      return json({ sha }, 201);
    }
    if (p.startsWith(`${base}/git/trees/`) && method === 'GET') {
      const id = p.split('/').pop();
      const treeSha = commits.has(id) ? commits.get(id).tree : id;
      const entries = trees.get(treeSha);
      return json({ tree: [...entries].map(([path, e]) => ({ path, type: 'blob', mode: '100644', sha: e.sha, size: blobs.get(e.sha)?.length })) });
    }
    if (p === `${base}/git/trees` && method === 'POST') {
      const entries = new Map(trees.get(body.base_tree));
      for (const t of body.tree) {
        if (t.sha === null) entries.delete(t.path);
        else entries.set(t.path, { sha: t.sha });
      }
      return json({ sha: newTree(entries) }, 201);
    }
    if (p === `${base}/git/commits` && method === 'POST') {
      const sha = SHA(counter++);
      commits.set(sha, { tree: body.tree, parents: body.parents, message: body.message });
      return json({ sha }, 201);
    }
    if (p === `${base}/git/refs/heads/main` && method === 'PATCH') {
      if (state.failNextRefUpdate) {
        state.failNextRefUpdate = false;
        return json({ message: 'Update is not a fast forward' }, 422);
      }
      head = body.sha;
      return json({ ref: 'refs/heads/main', object: { sha: head } });
    }
    if (p.startsWith(`${base}/contents/`)) {
      const ref = u.searchParams.get('ref');
      const sha = commits.has(ref) ? ref : head;
      const path = p.slice(`${base}/contents/`.length);
      const e = trees.get(commits.get(sha).tree).get(path);
      return e ? new Response(blobs.get(e.sha).toString('utf8'), { status: 200 }) : notFound();
    }

    // Repo catálogo
    if (p === `/repos/${catalog}/issues` && method === 'GET') {
      // staleList imita el desfase de GitHub: la lista aún no incluye lo recién escrito.
      if (staleList) return json([]);
      return json(issues.filter((i) => i.labels.includes('skill')).map((i) => ({ ...i, labels: i.labels })));
    }
    if (p === `/repos/${catalog}/issues` && method === 'POST') {
      const issue = {
        number: issues.length + 1,
        html_url: `https://github.com/${catalog}/issues/${issues.length + 1}`,
        body: body.body,
        created_at: new Date().toISOString(),
        user: { login: OWNER, avatar_url: 'https://avatars.githubusercontent.com/u/1' },
        labels: body.labels,
        title: body.title,
      };
      issues.push(issue);
      return json(issue, 201);
    }
    const patch = new RegExp(`^/repos/${catalog}/issues/([0-9]+)$`).exec(p);
    if (patch && method === 'PATCH') {
      const issue = issues[Number(patch[1]) - 1];
      issue.body = body.body;
      return json(issue);
    }
    return json({ message: `sin simular: ${method} ${p}` }, 500);
  };

  // Imita a alguien que edita un archivo directamente en GitHub.
  const externalCommit = (path, text) => {
    const blob = SHA(counter++);
    blobs.set(blob, Buffer.from(text));
    const entries = new Map(trees.get(commits.get(head).tree));
    entries.set(path, { sha: blob });
    const tree = newTree(entries);
    head = SHA(counter++);
    commits.set(head, { tree, parents: [], message: 'edición externa' });
  };

  return {
    fake,
    calls,
    state,
    externalCommit,
    commitMessage: (sha) => commits.get(sha).message,
    get head() {
      return head;
    },
    issues,
    headTree: () => trees.get(commits.get(head).tree),
    blobText: (sha) => blobs.get(sha).toString('utf8'),
    get repo() {
      return repo;
    },
  };
}

const bundleOf = (slug, files) => ({
  slug,
  files: files.map(([path, text]) => ({ path, sizeBytes: Buffer.byteLength(text), base64: Buffer.from(text).toString('base64') })),
});

const SKILL_V1 = '---\nname: pdf-tools\ndescription: Works with PDFs.\n---\n\n# PDF tools v1\n';
const realFetch = globalThis.fetch;
let uniq = 0;

// Cada prueba usa su propia cuenta y catálogo: la caché del servicio es global al módulo.
async function withGithub(opts, run) {
  const id = ++uniq;
  const owner = `user${id}`;
  const catalog = `test/cat${id}`;
  const session = { login: owner, token: 'tok', avatarUrl: 'https://avatars.githubusercontent.com/u/1' };
  const gh = makeGithub({ ...opts, owner, catalog });
  globalThis.fetch = async (...args) => {
    try {
      return await gh.fake(...args);
    } catch (e) {
      console.error('       [simulador]', args[0], e.message);
      throw e;
    }
  };
  try {
    await run(gh, m.createGithubCatalogService({ getSession: () => session, catalogRepo: catalog }), owner);
  } finally {
    globalThis.fetch = realFetch;
  }
}

await test('crea el repo, sube todo en un solo commit y registra la skill', () =>
  withGithub({}, async (gh, svc, owner) => {
    const steps = [];
    const skill = await svc.publishLocalSkill(
      bundleOf('pdf-tools', [['SKILL.md', SKILL_V1], ['scripts/run.md', 'run it']]),
      (p) => steps.push(p.step)
    );
    assert.equal(skill.name, 'pdf-tools');
    assert.equal(skill.repo, `${owner}/codice-skills`);
    assert.equal(skill.skillPath, 'skills/pdf-tools');
    assert.equal(skill.uploadedBy.login, owner);
    assert.ok(gh.calls.includes('POST /user/repos'));
    assert.equal(gh.calls.filter((c) => c.endsWith('/git/commits') && c.startsWith('POST')).length, 1);
    const tree = gh.headTree();
    assert.ok(tree.has('README.md') && tree.has('skills/pdf-tools/SKILL.md') && tree.has('skills/pdf-tools/scripts/run.md'));
    assert.equal(gh.blobText(tree.get('skills/pdf-tools/SKILL.md').sha), SKILL_V1);
    assert.equal(gh.issues.length, 1);
    assert.equal(gh.issues[0].title, `[skill] ${owner}/codice-skills/skills/pdf-tools`);
    assert.deepEqual([...new Set(steps)], ['repo', 'upload', 'register']);
  }));

await test('si el repo ya existe no lo vuelve a crear y conserva sus archivos', () =>
  withGithub({ existingRepo: true }, async (gh, svc) => {
    await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', SKILL_V1]]));
    assert.ok(!gh.calls.includes('POST /user/repos'));
    assert.ok(gh.headTree().has('README.md'));
  }));

await test('la skill recién subida aparece en la lista sin esperar a la caché', () =>
  withGithub({}, async (gh, svc, owner) => {
    await svc.listSkills(); // llena la caché con la lista vacía
    await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', SKILL_V1]]));
    const list = await svc.listSkills();
    assert.deepEqual(list.map((s) => s.id), [`${owner}/codice-skills/skills/pdf-tools`]);
    assert.equal(list[0].uploadedBy.login, owner);
  }));

await test('volver a subir actualiza el commit, borra archivos que ya no están y no duplica el Issue', () =>
  withGithub({}, async (gh, svc) => {
    const first = await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', SKILL_V1], ['old.md', 'old']]));
    const SKILL_V2 = SKILL_V1.replace('v1', 'v2');
    const second = await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', SKILL_V2], ['new.md', 'new']]));
    assert.notEqual(first.commitSha, second.commitSha);
    const tree = gh.headTree();
    assert.ok(!tree.has('skills/pdf-tools/old.md'), 'old.md debía borrarse');
    assert.ok(tree.has('skills/pdf-tools/new.md'));
    assert.equal(gh.blobText(tree.get('skills/pdf-tools/SKILL.md').sha), SKILL_V2);
    assert.equal(gh.issues.length, 1, 'no debe crear un segundo Issue');
    const list = await svc.listSkills();
    assert.equal(list.length, 1);
    assert.equal(list[0].commitSha, second.commitSha, 'el Issue ancla apunta al commit nuevo');
    const detail = await svc.getSkill(list[0].id);
    assert.match(detail.markdown, /v2/);
  }));

await test('aunque GitHub tarde en listar el Issue nuevo, la skill recién subida se abre y aparece', () =>
  withGithub({ staleList: true }, async (gh, svc, owner) => {
    const created = await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', SKILL_V1]]));
    const id = `${owner}/codice-skills/skills/pdf-tools`;
    assert.equal(created.id, id);
    const opened = await svc.getSkill(id);
    assert.ok(opened, 'getSkill no debe devolver null justo después de publicar');
    assert.match(opened.markdown, /v1/);
    assert.deepEqual((await svc.listSkills()).map((x) => x.id), [id]);

    // Una actualización también se ve de inmediato, con el commit nuevo.
    const V2 = SKILL_V1.replace('v1', 'v2');
    const second = await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', V2]]));
    assert.equal((await svc.listSkills())[0].commitSha, second.commitSha);
    assert.match((await svc.getSkill(id)).markdown, /v2/);
  }));

await test('un repo codice-skills privado se rechaza con un mensaje claro', () =>
  withGithub({ existingRepo: true, privateRepo: true }, async (gh, svc) => {
    await assert.rejects(svc.publishLocalSkill(bundleOf('x', [['SKILL.md', SKILL_V1]])), (e) => e.code === 'private_repo' && /privado/.test(e.message));
    assert.equal(gh.issues.length, 0);
  }));

await test('un paquete inválido se rechaza antes de tocar GitHub', () =>
  withGithub({}, async (gh, svc) => {
    const bad = [
      bundleOf('Mala Ruta', [['SKILL.md', 'x']]),
      bundleOf('ok', [['SKILL.md', 'x'], ['../escape.md', 'y']]),
      bundleOf('ok', [['SKILL.md', 'x'], ['.git/config', 'y']]),
      bundleOf('ok', [['a.md', 'x']]),
      bundleOf('ok', [['SKILL.md', 'x'], ['SKILL.md', 'y']]),
      { slug: 'ok', files: [{ path: 'SKILL.md', sizeBytes: 3, base64: '<script>' }] },
    ];
    for (const b of bad) await assert.rejects(svc.publishLocalSkill(b), (e) => e.code === 'invalid_input');
    assert.equal(gh.calls.length, 0, 'no debe haber hecho ninguna petición');
  }));

await test('sin sesión pide iniciar sesión con GitHub', async () => {
  const svc = m.createGithubCatalogService({ getSession: () => null, catalogRepo: 'test/catalog' });
  await assert.rejects(svc.publishLocalSkill(bundleOf('x', [['SKILL.md', SKILL_V1]])), (e) => e.code === 'auth_required');
});


/* ===================================================================== */
console.log('commitSkillChanges (editar una skill propia)');

const b64 = (t) => Buffer.from(t).toString('base64');
const postCommits = (gh) => gh.calls.filter((c) => c.startsWith('POST') && c.endsWith('/git/commits')).length;

async function published(gh, svc, owner) {
  const created = await svc.publishLocalSkill(bundleOf('pdf-tools', [['SKILL.md', SKILL_V1], ['notes.md', 'mis notas']]));
  return { id: `${owner}/codice-skills/skills/pdf-tools`, created };
}

await test('edita solo SKILL.md en un commit, conserva lo demás y actualiza el catálogo', () =>
  withGithub({}, async (gh, svc, owner) => {
    const { id, created } = await published(gh, svc, owner);
    const V2 = SKILL_V1.replace('v1', 'v2');
    const before = postCommits(gh);
    const notesBlob = gh.headTree().get('skills/pdf-tools/notes.md').sha;
    const updated = await svc.commitSkillChanges(id, [{ path: 'SKILL.md', base64: b64(V2), expectBase64: b64(SKILL_V1) }], { message: 'Corrige la intro' });
    assert.equal(postCommits(gh) - before, 1, 'un solo commit');
    assert.equal(gh.commitMessage(gh.head), 'Corrige la intro');
    const tree = gh.headTree();
    assert.equal(gh.blobText(tree.get('skills/pdf-tools/SKILL.md').sha), V2);
    assert.equal(tree.get('skills/pdf-tools/notes.md').sha, notesBlob, 'notes.md no se toca');
    assert.notEqual(updated.commitSha, created.commitSha);
    assert.equal(gh.issues.length, 1, 'el mismo Issue');
    assert.equal((await svc.listSkills())[0].commitSha, updated.commitSha);
    assert.match((await svc.getSkill(id)).markdown, /v2/);
  }));

await test('el mensaje del commit tiene un valor por defecto', () =>
  withGithub({}, async (gh, svc, owner) => {
    const { id } = await published(gh, svc, owner);
    await svc.commitSkillChanges(id, [{ path: 'SKILL.md', base64: b64(SKILL_V1 + 'x') }]);
    assert.equal(gh.commitMessage(gh.head), 'Actualiza pdf-tools desde Códice Studio');
  }));

await test('detecta una edición hecha en GitHub y no la pisa (conflicto)', () =>
  withGithub({}, async (gh, svc, owner) => {
    const { id } = await published(gh, svc, owner);
    gh.externalCommit('skills/pdf-tools/SKILL.md', 'alguien editó esto directamente en GitHub');
    const before = postCommits(gh);
    await assert.rejects(
      svc.commitSkillChanges(id, [{ path: 'SKILL.md', base64: b64(SKILL_V1 + 'mi cambio'), expectBase64: b64(SKILL_V1) }]),
      (e) => e.code === 'conflict' && /cambió en GitHub/.test(e.message)
    );
    assert.equal(postCommits(gh), before, 'no debe crear commits');
    assert.equal(gh.blobText(gh.headTree().get('skills/pdf-tools/SKILL.md').sha), 'alguien editó esto directamente en GitHub');
  }));

await test('si la rama se mueve mientras se guarda, avisa como conflicto', () =>
  withGithub({}, async (gh, svc, owner) => {
    const { id } = await published(gh, svc, owner);
    gh.state.failNextRefUpdate = true;
    await assert.rejects(svc.commitSkillChanges(id, [{ path: 'SKILL.md', base64: b64(SKILL_V1 + 'z') }]), (e) => e.code === 'conflict' && /cambió mientras guardabas/.test(e.message));
  }));

await test('solo se pueden editar skills del propio repositorio (sin tocar la red)', () =>
  withGithub({}, async (gh, svc) => {
    await assert.rejects(svc.commitSkillChanges('otra-persona/repo/skills/x', [{ path: 'SKILL.md', base64: b64('x') }]), (e) => e.code === 'forbidden' && /@otra-persona/.test(e.message));
    assert.equal(gh.calls.length, 0);
  }));

await test('puede borrar un archivo extra, pero no el SKILL.md', () =>
  withGithub({}, async (gh, svc, owner) => {
    const { id } = await published(gh, svc, owner);
    await assert.rejects(svc.commitSkillChanges(id, [{ path: 'SKILL.md', base64: null }]), (e) => e.code === 'invalid_input');
    await svc.commitSkillChanges(id, [{ path: 'notes.md', base64: null }]);
    assert.ok(!gh.headTree().has('skills/pdf-tools/notes.md'));
    assert.ok(gh.headTree().has('skills/pdf-tools/SKILL.md'));
  }));

await test('rechaza rutas peligrosas, repetidas o sin cambios antes de tocar GitHub', () =>
  withGithub({}, async (gh, svc, owner) => {
    const id = `${owner}/codice-skills/skills/pdf-tools`;
    const bad = [
      [],
      [{ path: '../x.md', base64: b64('x') }],
      [{ path: '.git/config', base64: b64('x') }],
      [{ path: 'a.md', base64: b64('x') }, { path: 'a.md', base64: b64('y') }],
      [{ path: 'a.md', base64: '<script>' }],
    ];
    for (const changes of bad) await assert.rejects(svc.commitSkillChanges(id, changes), (e) => e.code === 'invalid_input');
    assert.equal(gh.calls.length, 0);
  }));

await test('tras una edición externa, sincronizar pone el catálogo al día y permite volver a guardar', () =>
  withGithub({}, async (gh, svc, owner) => {
    const { id, created } = await published(gh, svc, owner);
    gh.externalCommit('skills/pdf-tools/SKILL.md', 'texto nuevo escrito directamente en GitHub');
    // El catálogo sigue fijado al commit viejo: leerla muestra la versión anterior.
    assert.match((await svc.getSkill(id)).markdown, /v1/);
    const synced = await svc.syncSkillToLatest(id);
    assert.notEqual(synced.commitSha, created.commitSha);
    assert.equal(synced.commitSha, gh.head);
    assert.equal((await svc.listSkills())[0].commitSha, gh.head);
    assert.equal(gh.issues.length, 1, 'el mismo Issue');
    const opened = await svc.getSkill(id);
    assert.equal(opened.markdown.trim(), 'texto nuevo escrito directamente en GitHub');
    // Con la versión nueva a la vista, ya se puede guardar sin conflicto.
    const saved = await svc.commitSkillChanges(id, [{ path: 'SKILL.md', base64: b64('mi cambio sobre el nuevo'), expectBase64: b64(opened.markdown) }]);
    assert.equal(gh.blobText(gh.headTree().get('skills/pdf-tools/SKILL.md').sha), 'mi cambio sobre el nuevo');
    assert.equal(saved.commitSha, gh.head);
  }));

await test('sincronizar solo funciona con skills del propio repositorio y con sesión', async () => {
  await withGithub({}, async (gh, svc) => {
    await assert.rejects(svc.syncSkillToLatest('otra-persona/repo/skills/x'), (e) => e.code === 'forbidden');
    assert.equal(gh.calls.length, 0);
  });
  const anon = m.createGithubCatalogService({ getSession: () => null, catalogRepo: 'test/catalog' });
  await assert.rejects(anon.syncSkillToLatest('a/b/c'), (e) => e.code === 'auth_required');
});

console.log('getProfile');

await test('devuelve los datos públicos y normaliza el sitio web', () =>
  withGithub({}, async (gh, svc, owner) => {
    const prof = await svc.getProfile(owner);
    assert.equal(prof.login, owner);
    assert.equal(prof.name, 'Alice Dev');
    assert.equal(prof.bio, 'Hago skills.');
    assert.equal(prof.location, 'Quito');
    assert.equal(prof.website, 'https://alice.dev/');
    assert.equal(prof.publicRepos, 7);
    assert.equal(prof.followers, 3);
    assert.equal(prof.joinedAt, '2020-01-01T00:00:00Z');
  }));
await test('una cuenta que no existe o un login inválido devuelven null', () =>
  withGithub({}, async (gh, svc) => {
    assert.equal(await svc.getProfile('no-existe-nadie'), null);
    assert.equal(await svc.getProfile('../x'), null);
  }));

console.log('texto de SKILL.md');

await test('utf8ToBase64 y base64ToUtf8 conservan acentos y emojis', () => {
  const t = 'Diseño rápido · ñandú 🚀';
  assert.equal(m.base64ToUtf8(m.utf8ToBase64(t)), t);
  assert.equal(m.utf8ToBase64('abc'), Buffer.from('abc').toString('base64'));
});
await test('buildSkillMd arma el frontmatter y se vuelve a leer igual', async () => {
  const md = m.buildSkillMd({ name: 'mi-skill', description: 'Hace: cosas   útiles  ', body: '# Hola\n\nCuerpo' });
  assert.match(md, /^---\nname: mi-skill\ndescription: "Hace: cosas útiles"\n---\n\n# Hola/);
  const d = await m.readLocalSkill([f('mi-skill.md', md)]);
  assert.equal(d.name, 'mi-skill');
  assert.equal(d.description, 'Hace: cosas útiles');
});
await test('checkSkillText separa errores de avisos', () => {
  assert.deepEqual(m.checkSkillText('   ').errors, ['El SKILL.md está vacío.']);
  assert.ok(m.checkSkillText(MD + 'ghp_' + 'A'.repeat(36)).errors.some((e) => /token de GitHub/.test(e)));
  assert.ok(m.checkSkillText('x'.repeat(200_001)).errors.some((e) => /caracteres/.test(e)));
  const sinFront = m.checkSkillText('# solo cuerpo');
  assert.equal(sinFront.errors.length, 0);
  assert.ok(sinFront.warnings.some((w) => /frontmatter/.test(w)));
  const incompleto = m.checkSkillText('---\nname: x\n---\ncuerpo');
  assert.ok(incompleto.warnings.some((w) => /description/.test(w)));
  const ok = m.checkSkillText(MD);
  assert.deepEqual([ok.errors.length, ok.warnings.length, ok.name], [0, 0, 'PDF Tools']);
});


console.log('computeMemberStats');

const mk = (id, login, category, hasScripts, registeredAt, repo = 'o/r') => ({
  id, name: id, description: '', author: { login: 'o', profileUrl: '' }, uploadedBy: { login, profileUrl: '' },
  repo, skillPath: id, license: null, category, hasScripts, commitSha: 'a'.repeat(40), markdown: '', files: [], registeredAt,
});

await test('cuenta por quien registró la skill, sin distinguir mayúsculas', () => {
  const all = [
    mk('a', 'Alice', 'diseño', true, '2026-11-01T10:00:00Z', 'alice/x'),
    mk('b', 'alice', 'diseño', false, '2026-11-05T10:00:00Z', 'alice/x'),
    mk('c', 'ALICE', 'meta', false, '2026-11-03T10:00:00Z', 'otros/y'),
    mk('d', 'bob', 'meta', true, '2026-11-09T10:00:00Z'),
  ];
  const st = m.computeMemberStats(all, 'alice');
  assert.equal(st.skills, 3);
  assert.deepEqual(st.categories, [{ name: 'diseño', count: 2 }, { name: 'meta', count: 1 }]);
  assert.equal(st.withScripts, 1);
  assert.deepEqual(st.repos, ['alice/x', 'otros/y']);
  assert.equal(st.lastUploadAt, '2026-11-05T10:00:00.000Z');
});
await test('sin skills devuelve ceros y sin fecha', () => {
  const st = m.computeMemberStats([mk('a', 'bob', 'x', false, '2026-11-01T00:00:00Z')], 'alice');
  assert.deepEqual([st.skills, st.categories.length, st.withScripts, st.repos.length, st.lastUploadAt], [0, 0, 0, 0, undefined]);
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} pruebas correctas`);
