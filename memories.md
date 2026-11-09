# 🧠 MEMORIES.md — Contexto Integral de Códice Studio (ai-skills-studio)

> **Documento de memoria técnica, arquitectónica y funcional**  
> **Proyecto:** `ai-skills-studio`  
> **Ubicación:** `C:\Users\mateo\Documents\proyects\ai-skills-studio`  
> **Versión actual:** `v2.2.1 (Hub Diagram SKILL.md Restaurado + Workspace VFS + MacBook Pro Showcase)`  
> **Rama activa:** `feat/tasteskill-workspace-overhaul` (`main` lista para PR)  
> **Última actualización:** Noviembre 2026

---

## 📜 Regla General Obligatoria: Estándares de Commits, Pull Requests y Lectura Previa

> [!CRITICAL]
> **OBLIGACIÓN INELUDIBLE PARA TODOS LOS AGENTES Y DESARROLLADORES:**
> Antes de crear cualquier commit o abrir un Pull Request en este repositorio, **ES OBLIGATORIO** leer y cumplir estrictamente la estructura definida en la skill `github-workflow-standards`.
>
> 1. **Lectura Previa Obligatoria:** Consultar `memories.md` para entender el contexto arquitectónico y los límites de archivos antes de tocar código.
> 2. **Formato de Commits (Conventional Commits):**
>    - Obligatorio: `<tipo>(<ámbito>): <descripción en imperativo y presente>`
>    - Tipos admitidos: `feat`, `refactor`, `fix`, `ui`, `docs`, `merge`, `ci`, `chore`.
>    - Ejemplo: `feat(workspace): replace legacy archive view with live VFS studio`
> 3. **Formato de Pull Requests (5 Secciones Obligatorias):**
>    - Todo PR debe responder obligatoriamente a las 5 preguntas reflexivas:
>      - `## 📌 ¿Qué es este proyecto / cambio?`
>      - `## 💡 ¿Por qué se creó? (El Por Qué)`
>      - `## 🎯 ¿Para qué sirve? (El Para Qué)`
>      - `## 🛠️ ¿Cómo está construido? (El Cómo)`
>      - `## 🧪 Pruebas & Validación (Checklist)`
>
> **ESTA ES UNA REGLA GENERAL QUE SÍ O SÍ SE DEBE CUMPLIR.** No se admitirán PRs vacíos, títulos genéricos ni commits sin el prefijo semántico correspondiente.

---

## 🎯 1. Visión y Propósito del Proyecto

**Códice Studio** es un IDE web local (100% client-side) y estación de auditoría para skills (`SKILL.md`) y workspaces de inteligencia artificial:

1. **Workspace Studio VFS en Memoria (Reemplazo radical de `.RAR`):** Montaje directo de carpetas locales (`showDirectoryPicker` / `webkitdirectory`), descompresión y exportación real de paquetes `.ZIP` / `.skillbundle` (`DecompressionStream('deflate-raw')` + CRC-32 sin dependencias externas), editor multi-pestaña en vivo, vista **Diff línea por línea** (rojo/verde), auditor anti-slop de `SKILL.md` e inspección binaria honesta de archivos `.rar` heredados.
2. **Arquitectura Editorial `design-taste-frontend` (`tasteskill 2.5.1`):** Una sección por pantalla (`min-height: 100svh`), bordes iguales alineados a `.wrap` (`1280px`), 90–95% carbón neutral (`#0a0d14` / `#121722`) con un único acento cian (`#0ea5e9`), cero tonos violeta en la interfaz propia, entrada `data-enter` en hero y momento `iris-opens` en `#benchmarks`.
3. **Benchmarking & Telemetría de 7 Modelos IA:** Comparador interactivo de velocidad (`tok/s`), latencia (`ms`) y precisión de código para Opus 5.5, Gemini 3.8, Sonnet 5.5, GPT Astra, Gemini 3.7, Opus 4.8 y GPT Luna.
4. **Sincronización con Obsidian y CLI:** Enlace nativo `obsidian://open?vault=ai-skills-studio` y generador de comando de instalación PowerShell en 1 clic.
5. **Catálogo UI/UX Accesible y Dictado por Voz:** Sandbox WAI-ARIA y evaluación hablada sanitizada con Web Speech API + fronteras de seguridad PBKDF2-SHA256.

---

## 🛠️ 2. Stack Tecnológico

| Capa | Tecnología | Versión | Rol en el Proyecto |
| :--- | :--- | :--- | :--- |
| **Framework UI** | React | `19.0.0` | Renderizado síncrono inicial (`flushSync`) compatible con el kit `design-taste-frontend` |
| **Lenguaje** | TypeScript | `~5.7.2` | Tipado estricto (`tsc -b`) sin dependencias de compresión externas |
| **Bundler & Dev Server** | Vite | `^6.2.0` | `base: './'`, `build.assetsDir: 'bundle'` y plugin de preservación de `public/assets/*` |
| **Sistema Editorial & Estilos** | `tasteskill 2.5.1` + Tailwind v4 | `2.5.1` / `^4.0.9` | `system.css` + `layout.css` en landing; utilidades Tailwind v4 sin Preflight en paneles IDE |
| **Iconografía** | Kit `icons.mjs` + Lucide React | `^0.475.0` | SVGs monocromos/marca oficiales en `public/assets/icons/` + controles internos IDE |
| **Verificación Real** | Chromium Headless Checkers | Node 22+ | `copy-lint.mjs`, `consistency.mjs`, `layout/check.mjs`, `shoot.mjs`, `perf.mjs`, `gate.mjs` |

---

## 🎨 3. Identidad Visual (`tasteskill 2.5.1` — `software`)

- **Deal Activo:** `hero centred`, `nav nav-centre`, `close close-type`, `footer footer-columns`, `rhythm surface-pairs`, `buttons pill`, `mark stack`, `ground sky`, `moments: iris-opens on #benchmarks`.
- **Paleta Neutral + Acento Único:**
  - Fondo Base (`--p-bg`): **Carbón Profundo (`#0a0d14`)**.
  - Superficie (`--p-surface`): **Pizarra Carbón (`#121722`)**.
  - Texto Principal (`--p-ink`): **Blanco Nítido (`#f1f5f9`)**.
  - Texto Secundario (`--p-muted`): **Gris Técnico (`#7e8288` / `#94a3b8`)**.
  - Acento Único (`--p-accent` / `--p-action`): **Cian (`#0ea5e9`, texto `#0a0d14`)**.
  - **Regla Anti-Slop:** Prohibición estricta de degradados o superficies violeta/púrpura en el cromo del producto.
- **Tipografía Oficial:** `Geist` (`400..700`) para display e interfaz; `Geist Mono` (`400..500`) para código, diffs y métricas (`tabular-nums`).

---

## 📁 4. Estructura de Directorios

```text
ai-skills-studio/
├── .agents/
│   └── skills/
│       └── github-workflow-standards/   # Skill oficial de flujo de commits y PRs
├── .github/
│   ├── pull_request_template.md        # Plantilla oficial de 5 secciones para PRs
│   └── workflows/
│       └── deploy.yml                  # Pipeline CI/CD a GitHub Pages
├── public/
│   ├── assets/                         # Kit inmutable de design-taste-frontend + iconos SVG
│   ├── favicon.svg                     # Marca geométrica stack en cian (#0ea5e9)
│   └── share.jpg                       # Imagen OpenGraph generada desde el hero real
├── memories.md                         # Memoria viva del proyecto (este archivo)
├── index.html                          # Entrypoint HTML con sistema tasteskill 2.5.1 y CSP
├── vite.config.ts                      # Vite con assetsDir: 'bundle' y preservación de kit
└── src/
    ├── App.tsx                         # Shell dual: flujo directo <section> en inicio + .ide-shell interno
    ├── main.tsx                        # Montaje síncrono con flushSync antes de system.js
    ├── index.css                       # Integración Tailwind v4 (sin Preflight) + ventana dock y app-frame
    ├── components/
    │   ├── NavbarActiveSkill.tsx       # header.nav.nav--centre con skip-link, mega-menú y tabs IDE
    │   ├── InformativeLandingSection.tsx # 5 pantallas 100svh: Hero, Workspace, Capacidades, Benchmarks, FAQ
    │   ├── ComputerLightBeamShowcase.tsx # Ventana IDE interactiva .ly-piece con dock de 7 modelos IA
    │   ├── UnifiedProjectStudio.tsx    # IDE Workspace VFS de 3 paneles (Árbol, Editor/Diff, Auditor/ZIP)
    │   ├── SkillManager.tsx            # Bóveda y gestor de skills Markdown (.md)
    │   ├── StylePresetCatalog.tsx      # Catálogo interactivo de componentes UI/UX accesibles
    │   ├── AIModelBenchmarkPanel.tsx   # Matriz comparativa de los 7 modelos IA
    │   └── AuthScreen.tsx              # Control de roles Colaborador/Visitante con PBKDF2
    ├── data/                           # Skills integradas (incluye design-taste-frontend y github-workflow-standards)
    ├── services/
    │   └── rarParserService.ts         # Motor VFS: ZIP real, carpetas locales, diff unificado y auditor SKILL.md
    ├── types/                          # Contratos TypeScript de Workspace y Skills
    └── utils/
        └── securityHardening.ts        # PBKDF2-SHA256, rate-limit, anti-Path Traversal, GDPR erase
```

---

## 🚀 5. Despliegue y URLs

* **URL en Vivo:** [https://suarezcaceres.github.io/ai-skills-studio/](https://suarezcaceres.github.io/ai-skills-studio/)
* **Repositorio:** [https://github.com/SuarezCaceres/ai-skills-studio](https://github.com/SuarezCaceres/ai-skills-studio)

---

## 🧪 6. Certificación de Calidad y Finish Gate (`tasteskill 2.5.1`)

La suite de validación anti-slop y consistencia visual en navegadores reales (`headless Chromium / Edge`) ha superado el 100% de las pruebas sin fallos bloqueantes:

| Herramienta de Auditoría | Comando Oficial | Resultado |
| :--- | :--- | :--- |
| **Linting Textual** | `node copy-lint.mjs dist/index.html --kind software` | **0 FAIL, 0 WARN (CLEAN)** |
| **Geometría de Layout** | `node layout/check.mjs dist/index.html --sizes 1440x900,1024x768,820x1180,768x1024,390x844` | **0 FINDINGS (5 anchos conformes)** |
| **Performance Web Vitals** | `node perf.mjs dist/index.html --widths 1440,390` | **0 FAIL, 2 WARN** (CLS 0.014 en desktop, 0.000 en móvil; FCP/LCP 376 ms) |
| **Consistencia Multiancho** | `node consistency.mjs dist/index.html --widths 1440,1024,820,768,390` | **0 FAIL, 63 WARN (CLEAN)** |
| **Finish Gate Oficial** | `node gate.mjs dist/index.html --root dist --kind software` | **GATE: PASS** |
| **Pruebas Visuales Multi-Ancho (Playwright)** | `npm test` (`node scripts/test-interfaces-playwright.mjs`) | **0 ERRORES (4 anchos: 1440, 1024, 768, 390)** |
| **Pruebas de Interacción VFS y Catálogo** | `npm test` (`node scripts/test-interactions-playwright.mjs`) | **PASS (Árbol VFS, Diff toggle, filtros y búsqueda)** |

---

## 🎨 7. Actualización v2.1.0 — Overhaul Anti-Slop Workspace VFS y Skills

- **Workspace VFS (`UnifiedProjectStudio.tsx`):**
  - Barra de comandos superior estilizada y compacta en carbón profundo `#121722` y bordes `slate-800`.
  - Árbol VFS con búsqueda en vivo, filtros de lenguaje compactos y badges tabulares.
  - Editor multi-pestaña con vista Diff sutil (adiciones en `emerald-950/40`, eliminaciones en `rose-950/40`) y canalón de números de línea sin saltos.
  - Telemetría, selector de directivas y comando PowerShell `Expand-Archive` con copia en 1 clic.
- **Skills & Códice (`SkillManager.tsx`):**
  - Eliminación completa de degradados estridentes y resplandores artificiales (`cyan-glow-sm`), sustituidos por el estándar de herramienta de desarrollo: fondos planos `#0ea5e9` y bordes limpios.
  - Filtros unificados por Tipo (Todo, Workspaces VFS, Guías, Repos) y Nivel (Principiante, Intermedio, Avanzado).
  - Tarjetas con micro-interacción de elevación de 2px y selección con borde cian izquierdo.
  - Corrección íntegra de mojibake y errores de sintaxis en `obsidian.svg` (comas decimales corregidas a puntos).

---

## 💻 8. Actualización v2.2.0 — Showcase Interactivo MacBook Pro Space Black y Logotipos Oficiales de IA

- **Showcase Fotorrealista MacBook Pro (`ComputerLightBeamShowcase.tsx`):**
  - Sustitución de cajas contenedoras superpuestas por un **único fondo difuminado** (*haz de luz volumétrico y aura ambiental `blur-3xl`*) con máscara radial elíptica que integra suavemente la máquina en la red neuronal de la página.
  - Fotografía real en alta fidelidad de una **Space Black MacBook Pro** con perspectiva de elevación de estudio.
  - **Pantalla OLED Liquid Retina interactiva** encapsulada con precisión milimétrica en el cristal (`left: 15.2%`, `width: 69.6%`, `top: 6.2%`, `height: 55.0%`), con diff visual de código, pestañas de VFS y botón de acción "Editar en Workspace".
  - **Hotspot táctil biométrico de Touch ID** (`left: 67.6%`, `top: 65.4%`) con pulsación interactiva y trackpad Force Touch con respuesta háptica.
- **Logotipos Vectoriales Oficiales de IA (`BrandIcons.tsx`):**
  - Integración de los vectores SVG oficiales y de marca para los 4 modelos principales:
    - **Claude Opus 5.5:** Estrella terracota oficial de Anthropic (`#D97757`).
    - **Gemini 3.8 Pro:** Chispa de 4 puntas de Google con gradiente cromático oficial (`#4285F4` $\rightarrow$ `#C58AF9` $\rightarrow$ `#38BDF8`).
    - **GPT Astra:** Espiral logarítmica oficial de OpenAI en verde esmeralda (`#10B981`).
    - **DeepSeek V3:** Ballena azul oficial de DeepSeek (`#2563EB`).
  - Barra selectora estilizada en formato píldora (`rounded-2xl`) con telemetría de velocidad en tiempo real (`tok/s`).
- **Fondo Interactivo de Red Neuronal (`InformativeLandingSection.tsx`):**
  - Restauración del fondo animado en canvas con nodos sinápticos, conexiones dinámicas reactivas al puntero y partículas en suspensión.
- **Editor Moderno VS Code & Auditoría VFS:**
  - Integración de visualizador de código de 10 líneas, canalón fijo de números de línea sin desbordes y sincronización bidireccional con el Workspace.

---

## 🧩 9. Actualización v2.2.1 — Restauración del Diagrama Hub de Capacidades SKILL.md e Icono Vectorial

- **Montaje React Determinista (`InformativeLandingSection.tsx`):**
  - Corrección de la inicialización de `window.TPDiagram.mount()` en el ciclo de vida de React (`useEffect`), eliminando la dependencia con el evento `DOMContentLoaded` que dejaba la caja vacía.
  - Limpieza de memoria en desmontaje (`destroy()`).
- **Icono Vectorial de Skill (`skill.svg`):**
  - Creación del nuevo glifo SVG oficial para `SKILL.md` con prompt directive (`>_`) y chispa cognitiva de IA en cian `#0ea5e9` y `#38bdf8`.
  - Vinculación del nodo `SKILL.md` al icono `skill` en la especificación del diagrama hub.
- **Integración Estética Cyber Dark (`index.css`):**
  - Anulación del fondo claro por defecto de `.panel` (`rgb(198, 211, 223)`) y aplicación de superficie profunda `#121722` con gradiente radial y borde sutil de 1px.
  - Adaptabilidad fluida probada en 1440px, 1024px, 768px y 390px.

