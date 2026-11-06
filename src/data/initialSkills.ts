import { SkillDocument } from '../types/skill';
import { DEFAULT_RAR_PACKAGE, computeLanguageBreakdown } from '../services/rarParserService';

const SAMPLE_SVG_SCREENSHOT_1 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" rx="20" fill="#0B0B0B"/>
  <rect x="16" y="16" width="608" height="328" rx="16" fill="#121212" stroke="#0EA5E9" stroke-opacity="0.35" stroke-width="1.5"/>
  <rect x="36" y="36" width="568" height="44" rx="22" fill="#0B0B0B" stroke="#0EA5E9" stroke-opacity="0.4" stroke-width="1.5"/>
  <circle cx="60" cy="58" r="6" fill="#0EA5E9"/>
  <circle cx="80" cy="58" r="6" fill="#0EA5E9"/>
  <circle cx="100" cy="58" r="6" fill="#38BDF8"/>
  <text x="126" y="63" fill="#F4F4F5" font-family="sans-serif" font-size="13" font-weight="bold">UI/UX Pro Max · Menubar Naranja &amp; Negro · Gemini Ultra</text>
  <rect x="36" y="100" width="260" height="220" rx="14" fill="#0B0B0B" stroke="#27272A" stroke-width="1.5"/>
  <text x="56" y="130" fill="#0EA5E9" font-family="sans-serif" font-size="14" font-weight="bold">Menú Desplegable Activo</text>
  <rect x="52" y="146" width="228" height="34" rx="10" fill="#0EA5E9"/>
  <text x="66" y="168" fill="#0B0B0B" font-family="sans-serif" font-size="12" font-weight="bold">✓ Generar Componente UI</text>
  <rect x="52" y="188" width="228" height="34" rx="10" fill="#161616"/>
  <text x="66" y="210" fill="#D4D4D8" font-family="sans-serif" font-size="12">Auditar Accesibilidad ARIA</text>
  <rect x="52" y="230" width="228" height="34" rx="10" fill="#161616"/>
  <text x="66" y="252" fill="#D4D4D8" font-family="sans-serif" font-size="12">Exportar Paquete (.rar / .md)</text>
  <rect x="316" y="100" width="288" height="220" rx="14" fill="#0B0B0B" stroke="#0EA5E9" stroke-opacity="0.3" stroke-width="1.5"/>
  <text x="336" y="132" fill="#0EA5E9" font-family="monospace" font-size="12">$ agy skill run ui-ux-pro-max.md</text>
  <text x="336" y="162" fill="#A1A1AA" font-family="monospace" font-size="11">[OK] role="menubar" validated</text>
  <text x="336" y="186" fill="#A1A1AA" font-family="monospace" font-size="11">[OK] RAR5 package extracted</text>
  <text x="336" y="210" fill="#0EA5E9" font-family="monospace" font-size="11">[MD] 1-Click Translation ES ready</text>
  <rect x="336" y="236" width="150" height="30" rx="15" fill="#0EA5E9"/>
  <text x="358" y="256" fill="#0B0B0B" font-family="sans-serif" font-size="11" font-weight="bold">Benchmark: 99.6%</text>
</svg>
`)}`;

const SAMPLE_SVG_SCREENSHOT_2 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" rx="20" fill="#0B0B0B"/>
  <rect x="24" y="24" width="592" height="312" rx="18" fill="#121212" stroke="#0EA5E9" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="48" y="64" fill="#F4F4F5" font-family="sans-serif" font-size="16" font-weight="bold">Observabilidad de Paquetes .RAR · Claude / Sonnet (Máximo / Alto)</text>
  <rect x="48" y="88" width="170" height="94" rx="14" fill="#0B0B0B" stroke="#0EA5E9" stroke-opacity="0.5"/>
  <text x="68" y="120" fill="#0EA5E9" font-family="sans-serif" font-size="12">Precisión Código TS</text>
  <text x="68" y="156" fill="#FFFFFF" font-family="monospace" font-size="24" font-weight="bold">99.1%</text>
  <rect x="235" y="88" width="170" height="94" rx="14" fill="#0B0B0B" stroke="#0EA5E9" stroke-opacity="0.4"/>
  <text x="255" y="120" fill="#38BDF8" font-family="sans-serif" font-size="12">Checks Ejecutados</text>
  <text x="255" y="156" fill="#FFFFFF" font-family="monospace" font-size="24" font-weight="bold">161 OK</text>
  <rect x="422" y="88" width="170" height="94" rx="14" fill="#0B0B0B" stroke="#27272A"/>
  <text x="442" y="120" fill="#A1A1AA" font-family="sans-serif" font-size="12">Velocidad Tokens</text>
  <text x="442" y="156" fill="#0EA5E9" font-family="monospace" font-size="24" font-weight="bold">118 t/s</text>
  <text x="48" y="224" fill="#D4D4D8" font-family="monospace" font-size="12">&gt; Árbol .rar e inspección de componentes UI/UX validados sin errores.</text>
</svg>
`)}`;

export const INITIAL_SKILLS: SkillDocument[] = [
  {
    id: 'skill-conversion-auditor',
    filename: 'auditor-de-conversiones.md',
    name: 'Auditor de Conversiones & Sistema UI Naranja/Negro (.RAR Suite)',
    summary:
      'Proyecto integral con paquete .rar descomprimido en memoria, componentes UI/UX con efectos glow naranja (#0EA5E9) y documentación técnica traducible en 1 clic.',
    category: 'Frontend & Conversión',
    level: 'Intermedio',
    kind: 'proyecto',
    tags: ['#ui-ux-pro-max', '#rar-package', '#cyan-glow', '#ui-menubar'],
    language: 'en',
    updatedAt: '2026-11-05T08:15:00.000Z',
    aiModelId: 'gemini-ultra-max',
    aiModelLabel: 'Gemini (Ultra / Máximo)',
    appliedSkill: 'ui-ux-pro-max',
    predominantLanguages: DEFAULT_RAR_PACKAGE.metadata.predominantLanguages,
    colorPalette: ['#0B0B0B', '#121212', '#0EA5E9', '#0EA5E9', '#38BDF8'],
    rarPackage: DEFAULT_RAR_PACKAGE,
    ficha: {
      whereToUse: 'Antigravity IDE, Estudio Integral .RAR y entornos React + TypeScript',
      requirements: 'Paquete .rar o archivo .md de la skill activo y acceso al panel de inspección de código',
      estimatedTime: 'Descompresión en memoria en < 50ms. Traducción instantánea en 1 clic sin voz.',
      collaborators: ['@sergiosuarez', '@jair_rjs'],
    },
    markdownContent: `---
name: ui-ux-pro-max
description: Design and build modern dark interfaces using high-contrast obsidian tones (#0B0B0B, #121212) and vibrant cyan accents (#0EA5E9, #0EA5E9).
---

# UI Component & Interactive Menu Architect

## Skill Purpose
Design and generate accessible menubars, keyboard-navigable dropdown menus, and dynamic command bars with subtle cyan glow effects.

## Instructions for the AI Agent
1. Always use native semantic elements (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Synchronize the \`aria-expanded\` state on every dropdown menu trigger.
3. Include clear keyboard shortcuts and support closing with the \`Escape\` key.

## Visual UI Plugins Specification
- Generate top menubar with File, Edit, View, and Deploy actions using \`#0B0B0B\` and \`#0EA5E9\`.

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
          label: 'Archivo .RAR / Skill',
          shortcut: 'Alt+A',
          checked: true,
          children: [
            { id: 'f-new', label: 'Subir Paquete .RAR', shortcut: 'Ctrl+O', checked: true },
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
        modelName: 'Gemini (Ultra / Máximo)',
        provider: 'Google DeepMind',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Genera la arquitectura .rar y los componentes UI/UX con velocidad de 148 tok/s.',
      },
      {
        id: 'mod-2',
        modelName: 'Claude / Sonnet (Máximo / Alto)',
        provider: 'Anthropic',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Excelente estructuración de código TypeScript y CSS con efectos glow.',
      },
    ],
    screenshots: [
      {
        id: 'shot-initial-1',
        title: 'Vista Previa UI/UX Naranja & Negro generada con Gemini (Ultra / Máximo)',
        dataUrl: SAMPLE_SVG_SCREENSHOT_1,
        createdAt: '08:12',
        modelUsed: 'Gemini (Ultra / Máximo)',
      },
      {
        id: 'shot-initial-2',
        title: 'Panel de Telemetría y Componentes UI/UX con Claude / Sonnet',
        dataUrl: SAMPLE_SVG_SCREENSHOT_2,
        createdAt: '08:15',
        modelUsed: 'Claude / Sonnet (Máximo / Alto)',
      },
    ],
    codeSnippets: [
      {
        id: 'code-initial-1',
        title: 'Componente Menubar Accesible con Sincronización ARIA',
        language: 'tsx',
        modelUsed: 'Gemini (Ultra / Máximo)',
        createdAt: '08:14',
        code: `<div role="menubar" aria-label="Menú de Skill" className="inline-flex rounded-full bg-[#0B0B0B] border border-[#0EA5E9]/30 p-1">
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
      'Arquitectura TypeScript y CSS que configura reglas persistentes, menús desplegables de contexto y hooks automáticos con inspección de código en árbol.',
    category: 'Arquitectura de Agentes',
    level: 'Principiante',
    kind: 'guia',
    tags: ['#modern-web-guidance', '#hooks', '#typescript', '#memoria'],
    language: 'en',
    updatedAt: '2026-11-05T08:00:00.000Z',
    aiModelId: 'claude-sonnet-max',
    aiModelLabel: 'Claude / Sonnet (Máximo / Alto)',
    appliedSkill: 'modern-web-guidance',
    predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
    colorPalette: ['#0B0B0B', '#121212', '#0EA5E9', '#0EA5E9', '#10B981'],
    rarPackage: {
      ...DEFAULT_RAR_PACKAGE,
      id: 'rar-memory-hooks-pkg',
      archiveName: 'claude-sonnet-memory-hooks.rar',
      metadata: {
        aiModelId: 'claude-sonnet-max',
        aiModelLabel: 'Claude / Sonnet (Máximo / Alto)',
        appliedSkill: 'modern-web-guidance',
        predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
        colorPalette: ['#0B0B0B', '#121212', '#0EA5E9', '#0EA5E9', '#10B981'],
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
        modelName: 'Claude / Sonnet (Máximo / Alto)',
        provider: 'Anthropic',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Mantiene consistencia entre sesiones leyendo el archivo .md al inicio.',
      },
    ],
    screenshots: [
      {
        id: 'shot-initial-3',
        title: 'Panel de Observabilidad y Auditoría con Claude / Sonnet',
        dataUrl: SAMPLE_SVG_SCREENSHOT_2,
        createdAt: '08:05',
        modelUsed: 'Claude / Sonnet (Máximo / Alto)',
      },
    ],
    codeSnippets: [],
  },
  {
    id: 'skill-multi-agent-ads',
    filename: 'multi-agent-orchestrator.md',
    name: 'Autonomous Multi-Agent Orchestrator · 161 checks & 3 parallel agents',
    summary:
      'Open-source architecture packaged in .rar that coordinates 3 parallel subagents, MCP servers, and interactive command bars with 1-click Spanish translation.',
    category: 'Multi-Agent & MCP',
    level: 'Avanzado',
    kind: 'proyecto',
    tags: ['#claude-opus', '#skill', '#mcp', '#subagents'],
    language: 'en',
    updatedAt: '2026-11-05T07:50:00.000Z',
    aiModelId: 'claude-opus-ultra',
    aiModelLabel: 'Claude / Opus (Ultra)',
    appliedSkill: 'google-antigravity-sdk',
    predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
    colorPalette: ['#0B0B0B', '#121212', '#0EA5E9', '#38BDF8', '#A855F7'],
    rarPackage: {
      ...DEFAULT_RAR_PACKAGE,
      id: 'rar-opus-multiagent-pkg',
      archiveName: 'claude-opus-multiagent-orchestrator.rar',
      metadata: {
        aiModelId: 'claude-opus-ultra',
        aiModelLabel: 'Claude / Opus (Ultra)',
        appliedSkill: 'google-antigravity-sdk',
        predominantLanguages: computeLanguageBreakdown(DEFAULT_RAR_PACKAGE.files),
        colorPalette: ['#0B0B0B', '#121212', '#0EA5E9', '#38BDF8', '#A855F7'],
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
        { id: 'ag-mcp', label: 'Sync Google Ads MCP', shortcut: 'Ctrl+2', checked: true },
        { id: 'ag-trace', label: 'Capture Live Screenshot', shortcut: 'Ctrl+3' },
        { id: 'ag-verify', label: 'Run 161 Audit Checks', shortcut: 'Ctrl+4' },
      ],
    },
    models: [
      {
        id: 'mod-5',
        modelName: 'Claude / Opus (Ultra)',
        provider: 'Anthropic',
        testedAt: '05/11/2026',
        status: 'optimal',
        notes: 'Razonamiento profundo (99.4%) para orquestar 3 subagentes paralelos y descomprimir paquetes complejos.',
      },
    ],
    screenshots: [
      {
        id: 'shot-initial-4',
        title: 'Arquitectura Multi-Agente verificada con Claude / Opus (Ultra)',
        dataUrl: SAMPLE_SVG_SCREENSHOT_1,
        createdAt: '07:55',
        modelUsed: 'Claude / Opus (Ultra)',
      },
    ],
    codeSnippets: [],
  },
];
