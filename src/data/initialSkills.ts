import { SkillDocument } from '../types/skill';
import { DEFAULT_RAR_PACKAGE, computeLanguageBreakdown } from '../services/rarParserService';

const SAMPLE_SVG_SCREENSHOT_1 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" rx="16" fill="#0A0D14"/>
  <rect x="16" y="16" width="608" height="328" rx="12" fill="#121722" stroke="#0EA5E9" stroke-opacity="0.35" stroke-width="1.5"/>
  <rect x="36" y="36" width="568" height="44" rx="10" fill="#0A0D14" stroke="#1E293B" stroke-width="1.5"/>
  <circle cx="60" cy="58" r="5" fill="#0EA5E9"/>
  <circle cx="78" cy="58" r="5" fill="#38BDF8"/>
  <circle cx="96" cy="58" r="5" fill="#14B8A6"/>
  <text x="122" y="63" fill="#F1F5F9" font-family="sans-serif" font-size="13" font-weight="bold">Workspace VFS · Menubar Carbon &amp; Cian · Gemini 3.8</text>
  <rect x="36" y="100" width="260" height="220" rx="10" fill="#0A0D14" stroke="#1E293B" stroke-width="1.5"/>
  <text x="56" y="130" fill="#0EA5E9" font-family="sans-serif" font-size="14" font-weight="bold">Workspace Activo</text>
  <rect x="52" y="146" width="228" height="34" rx="8" fill="#0EA5E9"/>
  <text x="66" y="168" fill="#0A0D14" font-family="sans-serif" font-size="12" font-weight="bold">✓ Auditar SKILL.md</text>
  <rect x="52" y="188" width="228" height="34" rx="8" fill="#121722"/>
  <text x="66" y="210" fill="#CBD5E1" font-family="sans-serif" font-size="12">Revisar Diff Unificado</text>
  <rect x="52" y="230" width="228" height="34" rx="8" fill="#121722"/>
  <text x="66" y="252" fill="#CBD5E1" font-family="sans-serif" font-size="12">Exportar Paquete (.zip / .md)</text>
  <rect x="316" y="100" width="288" height="220" rx="10" fill="#0A0D14" stroke="#0EA5E9" stroke-opacity="0.3" stroke-width="1.5"/>
  <text x="336" y="132" fill="#0EA5E9" font-family="monospace" font-size="12">$ node scripts/gate.mjs dist/index.html</text>
  <text x="336" y="162" fill="#94A3B8" font-family="monospace" font-size="11">PASS role="menubar" validated</text>
  <text x="336" y="186" fill="#94A3B8" font-family="monospace" font-size="11">PASS ZIP CRC-32 package ready</text>
  <text x="336" y="210" fill="#0EA5E9" font-family="monospace" font-size="11">PASS 1-Click Translation ES ready</text>
  <rect x="336" y="236" width="150" height="30" rx="8" fill="#0EA5E9"/>
  <text x="358" y="256" fill="#0A0D14" font-family="sans-serif" font-size="11" font-weight="bold">Benchmark: 99.6%</text>
</svg>
`)}`;

const SAMPLE_SVG_SCREENSHOT_2 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" rx="16" fill="#0A0D14"/>
  <rect x="24" y="24" width="592" height="312" rx="12" fill="#121722" stroke="#0EA5E9" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="48" y="64" fill="#F1F5F9" font-family="sans-serif" font-size="16" font-weight="bold">Observabilidad Workspace VFS · Claude Opus 5.5</text>
  <rect x="48" y="88" width="170" height="94" rx="10" fill="#0A0D14" stroke="#0EA5E9" stroke-opacity="0.5"/>
  <text x="68" y="120" fill="#0EA5E9" font-family="sans-serif" font-size="12">Precisión Código TS</text>
  <text x="68" y="156" fill="#FFFFFF" font-family="monospace" font-size="24" font-weight="bold">99.4%</text>
  <rect x="235" y="88" width="170" height="94" rx="10" fill="#0A0D14" stroke="#0EA5E9" stroke-opacity="0.4"/>
  <text x="255" y="120" fill="#38BDF8" font-family="sans-serif" font-size="12">Reglas Anti-Slop</text>
  <text x="255" y="156" fill="#FFFFFF" font-family="monospace" font-size="24" font-weight="bold">161 OK</text>
  <rect x="422" y="88" width="170" height="94" rx="10" fill="#0A0D14" stroke="#1E293B"/>
  <text x="442" y="120" fill="#94A3B8" font-family="sans-serif" font-size="12">Velocidad Tokens</text>
  <text x="442" y="156" fill="#0EA5E9" font-family="monospace" font-size="24" font-weight="bold">145 t/s</text>
  <text x="48" y="224" fill="#CBD5E1" font-family="monospace" font-size="12">&gt; Árbol VFS (.zip) e inspección de componentes UI/UX validados sin errores.</text>
</svg>
`)}`;

export const INITIAL_SKILLS: SkillDocument[] = [
  {
    id: 'skill-design-taste-frontend',
    filename: 'design-taste-frontend.md',
    name: 'Design Taste Frontend · Ingeniería Web Anti-Slop (tasteskill 2.5.1)',
    summary:
      'Sistema de ingeniería editorial para interfaces de software: una sección por pantalla (100svh), bordes iguales (.wrap), 95% carbón neutral + cian único (#0EA5E9), cero tonos violeta y auditoría en navegador real.',
    category: 'Frontend & Sistemas UI',
    level: 'Avanzado',
    kind: 'proyecto',
    tags: ['#design-taste-frontend', '#anti-slop', '#workspace-vfs', '#gate-pass'],
    language: 'es',
    updatedAt: '2026-11-07T16:00:00.000Z',
    aiModelId: 'claude-opus-5-5',
    aiModelLabel: 'Opus 5.5',
    appliedSkill: 'design-taste-frontend',
    predominantLanguages: DEFAULT_RAR_PACKAGE.metadata.predominantLanguages,
    colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8', '#14B8A6'],
    rarPackage: DEFAULT_RAR_PACKAGE,
    ficha: {
      whereToUse: 'Workspace Studio VFS, aplicaciones React 19 + Vite, sitios SaaS y herramientas de desarrollo',
      requirements: 'Node.js 20+, navegador Chromium para consistency.mjs y gate.mjs, paleta neutral definida en :root',
      estimatedTime: 'Verificación automatizada completa en menos de 35 segundos.',
      collaborators: ['@mateo', '@codice-studio'],
    },
    markdownContent: `---
name: design-taste-frontend
description: Build software interfaces with calm rhythm (100svh per section), equal container edges, 90-95% neutral carbon surfaces, a single cyan accent (#0EA5E9), and real browser verification.
---

# Design Taste Frontend · Anti-Slop Architecture

## Propósito de la Skill
Construir interfaces de producto y páginas técnicas con ritmo editorial, tipografía precisa (\`Geist\` + \`Geist Mono\`), fragmentos de producto reales y verificación objetiva en navegador headless.

## Reglas para el Agente IA
1. Mantén el 90–95% de la superficie en carbón neutral (\`#0A0D14\` / \`#121722\`) con un único acento funcional (\`#0EA5E9\`) y cero tonos violeta.
2. Respeta una idea por pantalla (\`min-height: 100svh\`) y alinea todos los bloques al contenedor \`.wrap\` (\`1280px\`).
3. Ejecuta \`copy-lint.mjs\`, \`consistency.mjs\`, \`layout/check.mjs\`, \`perf.mjs\` y \`gate.mjs\` antes de cerrar la entrega.`,
    uiSpec: {
      id: 'spec-taste-menubar',
      type: 'menubar',
      title: 'Workspace Studio · Finish Gate',
      theme: 'cyan',
      items: [
        {
          id: 'taste-vfs',
          label: 'Workspace VFS',
          shortcut: 'Alt+W',
          checked: true,
          children: [
            { id: 't-open-dir', label: 'Montar Carpeta Local', shortcut: 'Ctrl+O', checked: true },
            { id: 't-import-zip', label: 'Importar Paquete .ZIP', shortcut: 'Ctrl+I' },
            { id: 't-export-zip', label: 'Exportar .ZIP Estándar', shortcut: 'Ctrl+S' },
          ],
        },
        {
          id: 'taste-gate',
          label: 'Verificación Real',
          shortcut: 'Alt+G',
          children: [
            { id: 'g-copy', label: 'Ejecutar copy-lint.mjs', shortcut: 'F5', checked: true },
            { id: 'g-consistency', label: 'Ejecutar consistency.mjs', shortcut: 'F6', checked: true },
            { id: 'g-gate', label: 'Validar Finish Gate', shortcut: 'F7' },
          ],
        },
      ],
    },
    models: [
      {
        id: 'mod-taste-1',
        modelName: 'Claude Opus · Versión Opus 5.5',
        provider: 'Anthropic',
        testedAt: '07/11/2026',
        status: 'optimal',
        notes: 'Aplica las reglas de ritmo 100svh, jerarquía tipográfica y limpieza cromática con precisión arquitectónica.',
      },
      {
        id: 'mod-taste-2',
        modelName: 'Claude Sonnet · Versión Sonnet 5.5',
        provider: 'Anthropic',
        testedAt: '07/11/2026',
        status: 'optimal',
        notes: 'Implementa fragmentos UI interactivos y árboles VFS en TypeScript estricto sin regresiones.',
      },
    ],
    screenshots: [
      {
        id: 'shot-taste-1',
        title: 'Auditoría de Workspace VFS y Finish Gate en Códice Studio',
        dataUrl: SAMPLE_SVG_SCREENSHOT_1,
        createdAt: '16:00',
        modelUsed: 'Opus 5.5',
      },
    ],
    codeSnippets: [
      {
        id: 'code-taste-1',
        title: 'Tokens Base de Superficie Carbon & Cian Único',
        language: 'css',
        modelUsed: 'Opus 5.5',
        createdAt: '16:00',
        code: `:root {
  --bg: #0a0d14;
  --surface: #121722;
  --ink: #f1f5f9;
  --muted: #94a3b8;
  --accent: #0ea5e9;
}`,
      },
    ],
  },
  {
    id: 'skill-github-workflow-standards',
    filename: 'github-workflow-standards.md',
    name: 'GitHub Workflow Standards · Commits Semánticos y PRs en 5 Secciones',
    summary:
      'Estándar obligatorio para ramas aisladas (feat/*, fix/*), Conventional Commits atómicos en imperativo y Pull Requests estructurados en 5 secciones reflexivas con checklist verificable.',
    category: 'Ingeniería & Flujo Git',
    level: 'Intermedio',
    kind: 'guia',
    tags: ['#github-workflow-standards', '#conventional-commits', '#pull-request', '#git'],
    language: 'es',
    updatedAt: '2026-11-07T15:45:00.000Z',
    aiModelId: 'claude-sonnet-5-5',
    aiModelLabel: 'Sonnet 5.5',
    appliedSkill: 'github-workflow-standards',
    predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
    colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#10B981', '#38BDF8'],
    rarPackage: {
      ...DEFAULT_RAR_PACKAGE,
      id: 'vfs-github-workflow-pkg',
      archiveName: 'github-workflow-standards.zip',
    },
    ficha: {
      whereToUse: 'Repositorios Git locales y remotos, flujos CI/CD y revisiones de código en equipo',
      requirements: 'Git 2.40+, trabajo aislado fuera de main y compilación limpia antes de cada commit',
      estimatedTime: 'Aplicación inmediata en cada commit y apertura de Pull Request.',
      collaborators: ['@mateo', '@codice-studio'],
    },
    markdownContent: `---
name: github-workflow-standards
description: Enforce isolated feature branches, atomic Conventional Commits, and structured 5-section Pull Requests.
---

# GitHub Workflow Standards

## Propósito de la Skill
Garantizar trazabilidad técnica en cada repositorio mediante ramas dedicadas (\`feat/*\`, \`fix/*\`, \`refactor/*\`), mensajes Conventional Commits y Pull Requests documentados con rigor.

## Reglas Obligatorias
1. Nunca realices commits directos sobre \`main\` o \`master\`; crea siempre una rama descriptiva.
2. Redacta commits atómicos con formato \`<tipo>(<alcance>): <descripción en imperativo>\`.
3. Estructura todo Pull Request con las 5 secciones: ¿Qué es?, ¿Por qué se hizo?, ¿Para qué sirve?, ¿Cómo está construido? y Checklist de Verificación.`,
    uiSpec: {
      id: 'spec-git-palette',
      type: 'command-palette',
      title: 'Paleta Git · Commits & PRs',
      theme: 'emerald',
      items: [
        { id: 'git-branch', label: 'Crear rama feat/tasteskill-workspace-overhaul', shortcut: 'Ctrl+B', checked: true },
        { id: 'git-commit', label: 'Validar Conventional Commit semántico', shortcut: 'Ctrl+M', checked: true },
        { id: 'git-pr', label: 'Generar plantilla PR de 5 secciones', shortcut: 'Ctrl+P' },
      ],
    },
    models: [
      {
        id: 'mod-git-1',
        modelName: 'Claude Sonnet · Versión Sonnet 5.5',
        provider: 'Anthropic',
        testedAt: '07/11/2026',
        status: 'optimal',
        notes: 'Estructura commits atómicos y descripciones de Pull Request claras sin mezclar responsabilidades.',
      },
    ],
    screenshots: [
      {
        id: 'shot-git-1',
        title: 'Verificación de Rama y Checklist Técnico en Códice Studio',
        dataUrl: SAMPLE_SVG_SCREENSHOT_2,
        createdAt: '15:45',
        modelUsed: 'Sonnet 5.5',
      },
    ],
    codeSnippets: [
      {
        id: 'code-git-1',
        title: 'Ejemplo de Commit Semántico Atómico',
        language: 'bash',
        modelUsed: 'Sonnet 5.5',
        createdAt: '15:45',
        code: `git checkout -b feat/tasteskill-workspace-overhaul
git commit -m "feat(workspace): replace legacy archive view with live VFS studio"`,
      },
    ],
  },
  {
    id: 'skill-conversion-auditor',
    filename: 'auditor-de-conversiones.md',
    name: 'Auditor de Conversiones & Sistema UI Carbon/Cian (Workspace VFS)',
    summary:
      'Proyecto integral con paquete .zip descomprimido en memoria, componentes UI/UX con acento cian (#0EA5E9), vista Diff línea por línea y documentación técnica traducible en 1 clic.',
    category: 'Frontend & Conversión',
    level: 'Intermedio',
    kind: 'proyecto',
    tags: ['#ui-ux-pro-max', '#workspace-vfs', '#cyan-accent', '#ui-menubar'],
    language: 'en',
    updatedAt: '2026-11-05T08:15:00.000Z',
    aiModelId: 'gemini-ultra-max',
    aiModelLabel: 'Gemini 3.8',
    appliedSkill: 'ui-ux-pro-max',
    predominantLanguages: DEFAULT_RAR_PACKAGE.metadata.predominantLanguages,
    colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8', '#14B8A6'],
    rarPackage: DEFAULT_RAR_PACKAGE,
    ficha: {
      whereToUse: 'Antigravity IDE, Workspace Studio VFS y entornos React + TypeScript',
      requirements: 'Carpeta local, paquete .zip o archivo .md activo y acceso al panel de inspección de código',
      estimatedTime: 'Montaje en memoria en < 18ms. Traducción instantánea en 1 clic sin voz.',
      collaborators: ['@sergiosuarez', '@jair_rjs'],
    },
    markdownContent: `---
name: ui-ux-pro-max
description: Design and build modern dark interfaces using high-contrast carbon tones (#0A0D14, #121722) and crisp cyan accents (#0EA5E9).
---

# UI Component & Interactive Menu Architect

## Skill Purpose
Design and generate accessible menubars, keyboard-navigable dropdown menus, and dynamic command bars with clean focus states.

## Instructions for the AI Agent
1. Always use native semantic elements (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Synchronize the \`aria-expanded\` state on every dropdown menu trigger.
3. Include clear keyboard shortcuts and support closing with the \`Escape\` key.

## Visual UI Plugins Specification
- Generate top menubar with File, Edit, View, and Deploy actions using \`#0A0D14\` and \`#0EA5E9\`.

## Verification Rules
- Verify that menus do not shift layout and maintain high AA/AAA contrast.`,
    uiSpec: {
      id: 'spec-menubar-1',
      type: 'menubar',
      title: 'Barra de Comandos · Auditor & UI',
      theme: 'cyan',
      items: [
        {
          id: 'menu-file',
          label: 'Workspace / Skill',
          shortcut: 'Alt+A',
          checked: true,
          children: [
            { id: 'f-new', label: 'Importar Paquete .ZIP', shortcut: 'Ctrl+O', checked: true },
            { id: 'f-save', label: 'Guardar en Bóveda', shortcut: 'Ctrl+S' },
            { id: 'f-export', label: 'Descargar Markdown (.md)', shortcut: 'Ctrl+E' },
          ],
        },
        {
          id: 'menu-components',
          label: 'Componentes UI/UX',
          shortcut: 'Alt+M',
          children: [
            { id: 'c-menubar', label: 'Renderizar Menú de Barras', shortcut: 'Alt+1', checked: true },
            { id: 'c-dropdown', label: 'Renderizar Menú Desplegable', shortcut: 'Alt+2' },
            { id: 'c-palette', label: 'Abrir Paleta Rápida', shortcut: 'Ctrl+K' },
          ],
        },
        {
          id: 'menu-ai',
          label: 'Diagnóstico IA',
          shortcut: 'Alt+D',
          children: [
            { id: 'a-test', label: 'Ejecutar Benchmark de Modelo', shortcut: 'F5', checked: true },
            { id: 'a-translate', label: 'Traducir Markdown (1-Click)', shortcut: 'Ctrl+T' },
            { id: 'a-audit', label: 'Auditar Accesibilidad WCAG', shortcut: 'Ctrl+Shift+A' },
          ],
        },
      ],
    },
    models: [
      {
        id: 'mod-1',
        modelName: 'Gemini 3.8',
        provider: 'Google DeepMind',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Procesa árboles Workspace VFS completos y componentes UI/UX con velocidad de 178 tok/s.',
      },
      {
        id: 'mod-2',
        modelName: 'Sonnet 5.5',
        provider: 'Anthropic',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Excelente estructuración de código TypeScript y estados accesibles por teclado.',
      },
    ],
    screenshots: [
      {
        id: 'shot-initial-1',
        title: 'Vista Previa UI/UX Carbon & Cian generada con Gemini 3.8',
        dataUrl: SAMPLE_SVG_SCREENSHOT_1,
        createdAt: '08:12',
        modelUsed: 'Gemini 3.8',
      },
      {
        id: 'shot-initial-2',
        title: 'Panel de Telemetría y Componentes UI/UX con Opus 5.5',
        dataUrl: SAMPLE_SVG_SCREENSHOT_2,
        createdAt: '08:15',
        modelUsed: 'Opus 5.5',
      },
    ],
    codeSnippets: [
      {
        id: 'code-initial-1',
        title: 'Componente Menubar Accesible con Sincronización ARIA',
        language: 'tsx',
        modelUsed: 'Gemini 3.8',
        createdAt: '08:14',
        code: `<div role="menubar" aria-label="Menú de Skill" className="inline-flex rounded-full bg-[#0A0D14] border border-[#0EA5E9]/30 p-1">
  <button
    type="button"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    onClick={() => toggleMenu('archivo')}
    className="rounded-full bg-[#0EA5E9] px-4 py-1.5 text-xs font-bold text-black"
  >
    Archivo Skill
  </button>
</div>`,
      },
    ],
  },
  {
    id: 'skill-claude-memory-system',
    filename: 'sistema-memoria-agentes.md',
    name: 'Sistema de Memoria Persistente & Hooks para Agentes IA',
    summary:
      'Arquitectura TypeScript y CSS que configura reglas persistentes, menús desplegables de contexto y hooks automáticos con inspección de código en árbol VFS.',
    category: 'Arquitectura de Agentes',
    level: 'Principiante',
    kind: 'guia',
    tags: ['#modern-web-guidance', '#hooks', '#typescript', '#memoria'],
    language: 'en',
    updatedAt: '2026-11-05T08:00:00.000Z',
    aiModelId: 'claude-sonnet-max',
    aiModelLabel: 'Sonnet 5.5',
    appliedSkill: 'modern-web-guidance',
    predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
    colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8', '#10B981'],
    rarPackage: {
      ...DEFAULT_RAR_PACKAGE,
      id: 'vfs-memory-hooks-pkg',
      archiveName: 'claude-sonnet-memory-hooks.zip',
      metadata: {
        aiModelId: 'claude-sonnet-max',
        aiModelLabel: 'Sonnet 5.5',
        appliedSkill: 'modern-web-guidance',
        predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
        colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8', '#10B981'],
      },
    },
    ficha: {
      whereToUse: 'Cualquier entorno compatible con archivos SKILL.md, GEMINI.md o CLAUDE.md',
      requirements: 'Repositorio local y permisos de lectura/escritura de archivos Markdown',
      estimatedTime: 'Configuración en 90 segundos. Incluye traducción instantánea en 1 clic.',
      collaborators: ['@sergiosuarez', '@tododeia'],
    },
    markdownContent: `---
name: fullstack-security-auditor
description: Analyze repositories for performance bottlenecks, injection vulnerabilities, and Core Web Vitals issues.
---

# Full-Stack Security and Performance Auditor

## Skill Purpose
Analyze repositories for performance bottlenecks, injection vulnerabilities, and Core Web Vitals issues.

## Instructions for the AI Agent
1. Always use native semantic elements (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Synchronize the \`aria-expanded\` state on every dropdown menu trigger.
3. Include clear keyboard shortcuts and support closing with the \`Escape\` key.

## Visual UI Plugins Specification
- Create contextual dropdown menu to execute real-time security diagnostics.`,
    uiSpec: {
      id: 'spec-dropdown-2',
      type: 'dropdown',
      title: 'Menú Desplegable de Memoria & Hooks',
      theme: 'cyan',
      items: [
        {
          id: 'sec-scan',
          label: 'Sincronizar Contexto de Sesión (.md)',
          shortcut: 'Shift+F1',
          checked: true,
        },
        {
          id: 'sec-cwv',
          label: 'Verificar Reglas Persistentes Activas',
          shortcut: 'Shift+F2',
          checked: true,
        },
        {
          id: 'sec-headers',
          label: 'Inyectar Memoria de Proyecto',
          shortcut: 'Shift+F3',
        },
        {
          id: 'sec-report',
          label: 'Exportar Snapshot de Contexto',
          shortcut: 'Ctrl+R',
        },
      ],
    },
    models: [
      {
        id: 'mod-3',
        modelName: 'Sonnet 5.5',
        provider: 'Anthropic',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Mantiene consistencia entre sesiones leyendo el archivo .md al inicio.',
      },
    ],
    screenshots: [
      {
        id: 'shot-initial-3',
        title: 'Panel de Observabilidad y Auditoría con Sonnet 5.5',
        dataUrl: SAMPLE_SVG_SCREENSHOT_2,
        createdAt: '08:05',
        modelUsed: 'Sonnet 5.5',
      },
    ],
    codeSnippets: [],
  },
  {
    id: 'skill-multi-agent-ads',
    filename: 'multi-agent-orchestrator.md',
    name: 'Autonomous Multi-Agent Orchestrator · 161 checks & 3 parallel agents',
    summary:
      'Open-source architecture packaged in .zip VFS that coordinates 3 parallel subagents, MCP servers, and interactive command bars with 1-click Spanish translation.',
    category: 'Multi-Agent & MCP',
    level: 'Avanzado',
    kind: 'proyecto',
    tags: ['#claude-opus', '#skill', '#mcp', '#subagents'],
    language: 'en',
    updatedAt: '2026-11-05T07:50:00.000Z',
    aiModelId: 'claude-opus-ultra',
    aiModelLabel: 'Opus 5.5',
    appliedSkill: 'google-antigravity-sdk',
    predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
    colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8', '#14B8A6'],
    rarPackage: {
      ...DEFAULT_RAR_PACKAGE,
      id: 'vfs-opus-multiagent-pkg',
      archiveName: 'claude-opus-multiagent-orchestrator.zip',
      metadata: {
        aiModelId: 'claude-opus-ultra',
        aiModelLabel: 'Opus 5.5',
        appliedSkill: 'google-antigravity-sdk',
        predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
        colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8', '#14B8A6'],
      },
    },
    ficha: {
      whereToUse: 'Antigravity CLI, Claude Code, Cursor & MCP-enabled IDEs',
      requirements: 'Node.js 20+, MCP Server configuration & active skill selector',
      estimatedTime: 'Full parallel audit runs in under 45 seconds across 3 subagents.',
      collaborators: ['@nextlevelbuilder', '@google-deepmind'],
    },
    markdownContent: `---
name: agent-mcp-orchestrator
description: Coordinate specialized subagents, MCP tools, and step-by-step validations with full traceability.
---

# Autonomous Agents & MCP Workflows Orchestrator

## Skill Purpose
Coordinate specialized subagents, MCP tools, and step-by-step validations with full traceability.

## AI Agent Instructions
1. Always use native semantic elements (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Synchronize the \`aria-expanded\` state on every dropdown menu trigger.
3. Include clear keyboard shortcuts and support closing via the \`Escape\` key.

## Visual UI Plugins Specification
- Build floating toolbar to invoke subagents and export reports.`,
    uiSpec: {
      id: 'spec-toolbar-3',
      type: 'toolbar',
      title: 'Subagent & MCP Command Bar',
      theme: 'cyan',
      items: [
        { id: 'ag-spawn', label: 'Invoke 3 Parallel Subagents', shortcut: 'Ctrl+1', checked: true },
        { id: 'ag-mcp', label: 'Sync Workspace MCP', shortcut: 'Ctrl+2', checked: true },
        { id: 'ag-trace', label: 'Capture Live Screenshot', shortcut: 'Ctrl+3' },
        { id: 'ag-verify', label: 'Run 161 Audit Checks', shortcut: 'Ctrl+4' },
      ],
    },
    models: [
      {
        id: 'mod-5',
        modelName: 'Opus 5.5',
        provider: 'Anthropic',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Razonamiento profundo (99.4%) para orquestar 3 subagentes paralelos y auditar árboles VFS complejos.',
      },
    ],
    screenshots: [
      {
        id: 'shot-initial-4',
        title: 'Arquitectura Multi-Agente verificada con Opus 5.5',
        dataUrl: SAMPLE_SVG_SCREENSHOT_1,
        createdAt: '07:55',
        modelUsed: 'Opus 5.5',
      },
    ],
    codeSnippets: [],
  },
];
