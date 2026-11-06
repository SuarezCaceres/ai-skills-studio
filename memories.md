# 🧠 MEMORIES.md — Contexto Integral de Códice Studio (ai-skills-studio)

> **Documento de memoria técnica, arquitectónica y funcional**  
> **Proyecto:** `ai-skills-studio`  
> **Ubicación:** `C:\Users\mateo\Documents\proyects\ai-skills-studio`  
> **Versión actual:** `v1.2.0 (Rediseño Frontend Design Cyber Dark + GitHub Pages CI/CD)`  
> **Rama principal:** `main`  
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
>    - Ejemplo: `feat(showcase): restaurar laptop con dock de iconos de inteligencias artificiales`
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

**Códice Studio** es una estación de ingeniería interactiva y suite de observabilidad para agentes autónomos y skills de inteligencia artificial:

1. **Inspección Binaria de Archivos .RAR en Memoria:** Descompresión y análisis client-side de paquetes RAR4 y RAR5 mediante Web Workers y Typed Arrays (`ArrayBuffer`, `DataView`) sin backend intermedio.
2. **Benchmarking & Telemetría de 7 Modelos IA:** Comparador en tiempo real de velocidad (`tok/s`), latencia (`ms`) y razonamiento de Claude Opus 5.5, Gemini 3.8, Claude Sonnet 5.5, GPT Astra, etc.
3. **Sincronización Bidireccional con Obsidian:** Vínculo nativo mediante protocolo `obsidian://open?vault=ai-skills-studio`.
4. **Catálogo UI/UX Pro Max:** Sandbox interactivo de componentes accesibles (menús de barra, paletas de comando, modales).
5. **Evaluación de Accesibilidad por Voz:** Transcripción y síntesis con Web Speech API.

---

## 🛠️ 2. Stack Tecnológico

| Capa | Tecnología | Versión | Rol en el Proyecto |
| :--- | :--- | :--- | :--- |
| **Framework UI** | React | `19.0.0` | Orquestador de interfaz con React Hooks modernos |
| **Lenguaje** | TypeScript | `~5.7.2` | Tipado estricto con `vite/client` habilitado |
| **Bundler & Dev Server** | Vite | `^6.2.0` | Empaquetado optimizado con `base: './'` para despliegue flexible |
| **Estilos & Utility** | Tailwind CSS v4 | `^4.0.9` (`@tailwindcss/vite`) | Sistema de diseño atómico sin CSS duplicado |
| **Iconografía** | Lucide React | `^0.475.0` | Iconografía SVG uniforme y accesible |
| **Despliegue CI/CD** | GitHub Actions | `deploy-pages@v4` | Despliegue automatizado a GitHub Pages en cada push a `main` |

---

## 🎨 3. Identidad Visual: Cyber Dark Espacial (Frontend Design)

- **Atmósfera Base:** Fondo Negro astronómico (`#030712`) y superficies de panel carbón (`#0B1120`) con micro-bordes `border-slate-800`.
- **Paleta de Acentos Oficial:**
  - Primario / CTAs: **Cian Eléctrico Neón (`#0EA5E9` / `#38BDF8`)**.
  - Estados / Validación: **Verde Esmeralda (`#10B981`)**.
  - Texto Principal: **Blanco Nítido (`#F8FAFC`)**.
  - Texto Secundario: **Pizarra (`#94A3B8`)**.
- **Tipografía Oficial:**
  - Código, métricas y telemetría: `JetBrains Mono`.
  - Textos de interfaz y documentación: `Plus Jakarta Sans`.

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
├── memories.md                          # Memoria viva del proyecto (este archivo)
├── index.html                           # Entrypoint HTML con fuentes oficiales
├── vite.config.ts                       # Configuración de Vite con base path relativo
├── package.json                         # Dependencias y scripts
├── tsconfig.json                        # Configuración de compilador TypeScript
└── src/
    ├── App.tsx                          # Enrutador principal y layout shell
    ├── main.tsx                         # Montaje en el DOM
    ├── index.css                        # Tokens base Cyber Dark y scrollbars ergonómicas
    ├── components/                      # Módulos y componentes de la plataforma
    │   ├── ComputerLightBeamShowcase.tsx # Laptop con dock de IAs y haces de luz
    │   ├── InformativeLandingSection.tsx # Landing informativa de inicio
    │   ├── NavbarActiveSkill.tsx        # Cabecera instrumental flotante
    │   ├── CodiceStudio.tsx             # Workspace visual para Obsidian
    │   ├── SkillManager.tsx             # Gestor y auditor de skills .md
    │   ├── UnifiedProjectStudio.tsx     # Suite de proyectos y explorador RAR
    │   ├── AIModelBenchmarkPanel.tsx    # Comparador y telemetría de modelos IA
    │   └── ...
    ├── data/                            # Catálogos estáticos
    ├── services/                        # Parser binario de paquetes .RAR
    ├── types/                           # Interfaces y tipos TypeScript
    └── utils/                           # Seguridad criptográfica PBKDF2
```

---

## 🚀 5. Despliegue y URLs

* **URL en Vivo:** [https://suarezcaceres.github.io/ai-skills-studio/](https://suarezcaceres.github.io/ai-skills-studio/)
* **Repositorio:** [https://github.com/SuarezCaceres/ai-skills-studio](https://github.com/SuarezCaceres/ai-skills-studio)
