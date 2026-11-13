import type {
  CatalogApi,
  CatalogSkill,
  GithubSession,
  SkillAuthor,
  SkillResultReport,
  SkillVotes,
} from '../../types/catalog';

/**
 * Implementación en memoria de `CatalogApi` para el WT2.
 * Se usa mientras el WT1 (`githubCatalogService`) no esté fusionado; la
 * integración final solo cambia qué instancia recibe `SkillDetailPage`.
 * Los textos de las skills simulan contenido externo NO confiable (incluyen
 * HTML y enlaces peligrosos a propósito para probar la sanitización).
 */

const LATENCY_MS = 280;

const wait = <T>(value: T, ms = LATENCY_MS): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const author = (login: string): SkillAuthor => ({
  login,
  profileUrl: `https://github.com/${login}`,
});

/** Sesión de ejemplo para pruebas visuales y de interacción. */
export const MOCK_SESSION: GithubSession = {
  login: 'demo-user',
  token: 'mock-token-no-real',
};

const FRONTEND_MARKDOWN = `---
name: design-taste-frontend
description: Builds professional company websites with one system and a finish gate.
license: MIT
---

# design-taste-frontend

Anti-slop frontend skill. It builds **professional company websites** with *one* system, plain copy and a finish gate that runs in a real browser.

## When to use it

Use it whenever you build, redesign or review a landing page:

- Company, product, shop or SaaS sites
- Static HTML/CSS or an existing React project
- Pages that look generic or "AI-made"

## Workflow

1. Read the brief and pick a deal (hero, nav, footer, rhythm).
2. Build one section per screen with equal edges.
3. Run the checker and the finish gate before shipping.

> Never ship a page that fails the gate. Fix the finding, then run it again.

### Install the checker

\`\`\`bash
node gate.mjs dist/index.html --root dist --kind software
\`\`\`

Inline code such as \`copy-lint.mjs\` renders as code. Read the [project docs](https://github.com/example/design-taste) for more.

| Check | Command | Result |
| :--- | :--- | :--- |
| Copy lint | \`copy-lint.mjs\` | 0 FAIL |
| Layout | \`layout/check.mjs\` | 0 findings |

---

<script>alert('xss')</script>

[Enlace peligroso](javascript:alert(1)) y ![imagen de rastreo](https://tracker.example/pixel.png)
`;

const TESTING_MARKDOWN = `# webapp-testing

Toolkit to drive a local web app with Playwright, capture screenshots and read browser logs.

## Steps

1. Start the dev server.
2. Run the script with the reconnaissance-then-action pattern.
3. Review screenshots and console output.

\`\`\`js
const browser = await chromium.launch({ headless: true });
\`\`\`
`;

const RAW_SKILLS: Array<Omit<CatalogSkill, 'uploadedBy'>> = [
  {
    id: 'SuarezCaceres/ai-skills-studio/skills/design-taste-frontend',
    name: 'design-taste-frontend',
    description:
      'Builds professional company websites with one system, real product UI and a finish gate enforced in a real browser.',
    author: author('SuarezCaceres'),
    repo: 'SuarezCaceres/ai-skills-studio',
    skillPath: 'skills/design-taste-frontend',
    license: 'MIT',
    category: 'Frontend',
    hasScripts: true,
    commitSha: '3c45fd2a91b7e0c4d5f6a7b8c9d0e1f2a3b4c5d6',
    markdown: FRONTEND_MARKDOWN,
    files: [
      { path: 'SKILL.md', sizeBytes: FRONTEND_MARKDOWN.length, content: FRONTEND_MARKDOWN },
      {
        path: 'scripts/gate.mjs',
        sizeBytes: 4120,
        content: "import { chromium } from 'playwright';\n// finish gate\nexport {};\n",
      },
      { path: 'scripts/copy-lint.mjs', sizeBytes: 2874 },
      { path: 'references/system.md', sizeBytes: 12980 },
      { path: 'references/layout/check-rules-with-a-very-long-nested-path-name.md', sizeBytes: 6410 },
    ],
    registeredAt: '2026-11-02T10:12:00Z',
  },
  {
    id: 'SuarezCaceres/ai-skills-studio/skills/github-workflow-standards',
    name: 'github-workflow-standards',
    description: 'Conventional Commits and a five-section pull request template.',
    author: author('SuarezCaceres'),
    repo: 'SuarezCaceres/ai-skills-studio',
    skillPath: 'skills/github-workflow-standards',
    license: 'Apache-2.0',
    category: 'Workflow',
    hasScripts: false,
    commitSha: '3c45fd2a91b7e0c4d5f6a7b8c9d0e1f2a3b4c5d6',
    markdown: '# github-workflow-standards\n\nCommit and PR rules for the repository.\n',
    files: [{ path: 'SKILL.md', sizeBytes: 64 }],
    registeredAt: '2026-11-03T09:00:00Z',
  },
  {
    id: 'SuarezCaceres/ai-skills-studio/skills/webapp-testing',
    name: 'webapp-testing',
    description: 'Drive a local web app with Playwright, capture screenshots and read logs.',
    author: author('SuarezCaceres'),
    repo: 'SuarezCaceres/ai-skills-studio',
    skillPath: 'skills/webapp-testing',
    license: null,
    category: 'Testing',
    hasScripts: true,
    commitSha: '3c45fd2a91b7e0c4d5f6a7b8c9d0e1f2a3b4c5d6',
    markdown: TESTING_MARKDOWN,
    files: [
      { path: 'SKILL.md', sizeBytes: TESTING_MARKDOWN.length, content: TESTING_MARKDOWN },
      { path: 'scripts/with_server.py', sizeBytes: 3300 },
    ],
    registeredAt: '2026-11-04T16:30:00Z',
  },
  {
    id: 'octo-labs/agent-recipes/security-and-hardening',
    name: 'security-and-hardening',
    description: 'Hardens code against OWASP vulnerabilities and audits dependencies.',
    author: author('octo-labs'),
    repo: 'octo-labs/agent-recipes',
    skillPath: 'security-and-hardening',
    license: 'MIT',
    category: 'Security',
    hasScripts: false,
    commitSha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    markdown: '# security-and-hardening\n\nChecklist-driven security review.\n',
    files: [{ path: 'SKILL.md', sizeBytes: 58 }],
    registeredAt: '2026-11-05T12:00:00Z',
  },
];

/** En el mock, quien sube la skill es su propio autor. */
const SKILLS: CatalogSkill[] = RAW_SKILLS.map((s) => ({ ...s, uploadedBy: s.author }));

const RESULTS: SkillResultReport[] = [
  {
    id: 'r1',
    skillId: SKILLS[0].id,
    model: 'Opus 5.5',
    verdict: 'worked',
    comment: 'Generó la landing completa y pasó el gate a la primera.',
    evidenceUrl: 'https://github.com/SuarezCaceres/ai-skills-studio/issues/12',
    author: author('lucia-dev'),
    createdAt: '2026-11-06T08:20:00Z',
    issueUrl: 'https://github.com/SuarezCaceres/ai-skills-studio/issues/12',
  },
  {
    id: 'r2',
    skillId: SKILLS[0].id,
    model: 'Opus 5.5',
    verdict: 'partial',
    comment: 'Funcionó, pero tuve que pedir dos veces el ajuste del footer en móvil.',
    author: author('mateo-ui'),
    createdAt: '2026-11-07T14:05:00Z',
    issueUrl: 'https://github.com/SuarezCaceres/ai-skills-studio/issues/14',
  },
  {
    id: 'r3',
    skillId: SKILLS[0].id,
    model: 'Gemini 3.8',
    verdict: 'failed',
    comment: 'Ignoró el archivo de referencias y generó una página genérica.',
    evidenceUrl: 'javascript:alert(1)',
    author: author('sofi-ia'),
    createdAt: '2026-11-08T19:45:00Z',
    issueUrl: 'https://github.com/SuarezCaceres/ai-skills-studio/issues/15',
  },
  {
    id: 'r4',
    skillId: SKILLS[0].id,
    model: 'Sonnet 5.5',
    verdict: 'worked',
    comment: 'Muy buen resultado con un brief corto.',
    evidenceUrl: 'https://example.com/captura.png',
    author: author('lucia-dev'),
    createdAt: '2026-11-09T09:10:00Z',
    issueUrl: 'https://github.com/SuarezCaceres/ai-skills-studio/issues/17',
  },
];

const votes = new Map<string, SkillVotes>(
  SKILLS.map((s, i) => [s.id, { skillId: s.id, count: [42, 17, 9, 3][i] ?? 0, votedByMe: false }])
);

function parseRepoUrl(repoUrl: string): { owner: string; repo: string; path: string } {
  let url: URL;
  try {
    url = new URL(repoUrl.trim());
  } catch {
    throw new Error('La URL no es válida.');
  }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
    throw new Error('Solo se admiten URLs de repositorios de github.com.');
  }
  const [owner, repo, kind, , ...rest] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) throw new Error('La URL debe apuntar a un repositorio (usuario/repo).');
  return {
    owner,
    repo: repo.replace(/\.git$/, ''),
    path: kind === 'tree' ? rest.join('/') : '',
  };
}

export const mockCatalogApi: CatalogApi = {
  async registerSkillFromUrl(repoUrl) {
    const { owner, repo, path } = parseRepoUrl(repoUrl);
    const name = path.split('/').pop() || repo;
    const id = [owner, repo, path].filter(Boolean).join('/');
    const existing = SKILLS.find((s) => s.id === id);
    if (existing) return wait(existing, 600);
    const created: CatalogSkill = {
      id,
      name,
      description: `Skill registered from ${owner}/${repo}.`,
      author: author(owner),
      uploadedBy: author(MOCK_SESSION.login),
      repo: `${owner}/${repo}`,
      skillPath: path,
      license: null,
      category: 'Sin categoría',
      hasScripts: false,
      commitSha: '0000000000000000000000000000000000000000',
      markdown: `# ${name}\n\nSkill registrada desde ${owner}/${repo}.\n`,
      files: [{ path: 'SKILL.md', sizeBytes: 64 }],
      registeredAt: new Date().toISOString(),
    };
    SKILLS.push(created);
    votes.set(id, { skillId: id, count: 0, votedByMe: false });
    return wait(created, 600);
  },
  listSkills: () => wait([...SKILLS]),
  getSkill: (id) => wait(SKILLS.find((s) => s.id === id) ?? null),
  listSkillsByAuthor: (login) =>
    wait(SKILLS.filter((s) => s.author.login.toLowerCase() === login.toLowerCase())),
  listResults: (skillId) => wait(RESULTS.filter((r) => r.skillId === skillId)),
  async reportResult(input) {
    const report: SkillResultReport = {
      ...input,
      id: `r${RESULTS.length + 1}`,
      author: author(MOCK_SESSION.login),
      createdAt: new Date().toISOString(),
      issueUrl: `https://github.com/${SKILLS.find((s) => s.id === input.skillId)?.repo ?? 'demo/demo'}/issues/${100 + RESULTS.length}`,
    };
    RESULTS.push(report);
    return wait(report, 450);
  },
  async getVotes(skillId) {
    return wait(votes.get(skillId) ?? { skillId, count: 0, votedByMe: false });
  },
  async toggleVote(skillId) {
    const current = votes.get(skillId) ?? { skillId, count: 0, votedByMe: false };
    const next: SkillVotes = {
      skillId,
      votedByMe: !current.votedByMe,
      count: Math.max(0, current.count + (current.votedByMe ? -1 : 1)),
    };
    votes.set(skillId, next);
    return wait({ ...next }, 160);
  },
};
