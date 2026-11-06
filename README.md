# 🧠 Códice Studio · Ecosistema Neuronal IA

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0.9-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GitLab CI/CD](https://img.shields.io/badge/GitLab_CI%2FCD-Passing-FC6D26?style=flat-square&logo=gitlab&logoColor=white)](https://gitlab.com/SuarezCaceres/ai-skills-studio/-/pipelines)
[![Deploy](https://img.shields.io/badge/Live_Deploy-GitLab_Pages-0EA5E9?style=flat-square&logo=firefox-browser&logoColor=white)](https://ai-skills-studio-3ce497.gitlab.io)

> **Estación de ingeniería interactiva y suite de observabilidad para agentes autónomos y skills de IA.**
> Procesa paquetes `.rar` binarios en memoria sin servidor, ejecuta benchmarking en tiempo real de 7 modelos fundacionales (Claude Opus 5.5, Gemini 3.8, GPT Astra), ofrece un catálogo de componentes interactivos UI/UX y sincroniza bidireccionalmente con la bóveda de **Obsidian**.

---

## 🌐 Despliegue en Vivo y Producción

* **URL Oficial en Producción (GitLab Pages):**  
  👉 **[https://ai-skills-studio-3ce497.gitlab.io](https://ai-skills-studio-3ce497.gitlab.io)**
* **Redirección Canónica:**  
  👉 **[https://suarezcaceres.gitlab.io/ai-skills-studio](https://suarezcaceres.gitlab.io/ai-skills-studio)**

---

## 📌 ¿De qué trata el proyecto?

**Códice Studio** resuelve la necesidad de auditar, editar, probar y sincronizar *skills* y agentes de inteligencia artificial dentro de un entorno visual de alta fidelidad, rápido y completamente seguro:

1. **Inspección Binaria de Archivos `.RAR` en el Navegador (*Client-Side Engine*):**
   - Descomprime y analiza en memoria encabezados de paquetes RAR4 y RAR5 mediante Web Workers y Typed Arrays (`ArrayBuffer`, `DataView`), sin necesidad de enviar archivos pesados a un backend externo.
   - Genera árboles de archivos interactivos, visualiza código fuente en tiempo real y calcula métricas de lenguajes (`computeLanguageBreakdown`).
2. **Benchmarking & Telemetría de Modelos Fundacionales:**
   - Compara las 7 versiones líderes de IA en razonamiento profundo, velocidad de inferencia (`tok/s`), latencia de respuesta (`ms`) y fidelidad multimodal:
     - **Claude Opus 5.5 / 4.8** (Anthropic · Cortex Supremo · 99.4% precisión)
     - **Gemini 3.8 / 3.7 Live** (Google DeepMind · 178 tok/s · Contexto multimodal)
     - **Claude Sonnet 5.5** (Anthropic · Agentes reflexivos)
     - **GPT Astra / Luna** (OpenAI · Inferencia visual)
3. **Catálogo UI/UX Pro Max en Vivo:**
   - Sandbox interactivo con menús de barras accesibles (`menubar`), menús desplegables (`dropdown`), paletas de comandos (`command-palette`) y barras de herramientas dinámicas con soporte completo de teclado.
4. **Sincronización Bidireccional con Obsidian:**
   - Cada skill creada o modificada se vincula directamente con notas `.md` locales y con el grafo de conocimiento mediante el protocolo nativo `obsidian://open?vault=ai-skills-studio`.
5. **Evaluación de Accesibilidad por Voz (Web Speech API):**
   - Transcripción en tiempo real y síntesis de voz en español para interactuar con las directivas de las skills y componentes.

---

## 🎨 Dirección de Arte: Cyber Dark Espacial (UI/UX Pro Max)

El proyecto cuenta con un sistema de diseño propio inspirado en plataformas como **Linear**, **Vercel** y **Raycast**, diseñado para eliminar la fatiga visual en sesiones prolongadas de ingeniería:

* **Atmósfera Base:** Azul noche profundo (`#030712`) y morado espacial (`#0B081B`), con nebulosas de luz difuminadas (`blur-[140px]`) y una cuadrícula de precisión técnica con red neuronal viva en Canvas 2D (60–120 FPS).
* **Superficies Glassmorphic:** Paneles oscuros translúcidos (`#0B0F19/80`) con micro-bordes en morado tenue (`border-violet-900/30`) que reaccionan al hover con resplandor cian neón.
* **Paleta Oficial (Cero Naranja):**
  * **Color Primario / CTAs:** **Cian Eléctrico Neón (`#0EA5E9` / `#38BDF8`)** en botones principales, pestañas activas y anillos de foco.
  * **Color de Apoyo / Estados:** **Verde Esmeralda Suave (`#34D399`)** estrictamente reservado para badges de estado (*"Live Sync"*, *"Activo"* y checks de validación).
  * **Jerarquía Tipográfica:** Títulos en **Blanco Puro (`#FFFFFF`)**, descripciones en **Gris Azulado Claro (`#94A3B8`)** y titulares destacados con degradado suave de cian a violeta (`from-[#38BDF8] via-[#0EA5E9] to-[#C084FC]`).

---

## 🛠️ Tecnologías y Arquitectura

```mermaid
flowchart TD
    subgraph UI["Capa Visual & Presentación (Frontend)"]
        REACT["React 19 (Hooks, Concurrent Mode, Suspense)"]
        VITE["Vite 6 + Rolldown Optimizations"]
        TAILWIND["Tailwind CSS v4 (Theme Tokens)"]
        LUCIDE["Lucide React Icons (SVG Vectors)"]
        CANVAS["Canvas 2D Reactivo (60-120 FPS)"]
    end

    subgraph ENGINE["Motor de Procesamiento en Cliente"]
        RAR["rarParserService (Web Workers / DataView)"]
        CRYPTO["Web Crypto API (PBKDF2 + SHA-256)"]
        SPEECH["Web Speech API (STT & TTS en Español)"]
        TRANSLATE["translationService (Algoritmo AST Markdown)"]
    end

    subgraph DEVOPS["DevOps & CI/CD"]
        GITLAB["GitLab CI/CD Pipeline (Docker node:20-alpine)"]
        PAGES["GitLab Pages (Hosting SSL Global)"]
        VERCEL["Vercel / Cloudflare Pages Compatible"]
    end

    UI --> ENGINE
    ENGINE --> DEVOPS
```

### Detalle de Tecnologías:

| Categoría | Tecnología | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Framework UI** | `React 19.0.0` | Arquitectura basada en componentes funcionales, `React.lazy` y `<Suspense>` para división de código (*code-splitting*). |
| **Lenguaje** | `TypeScript 5.7.2` | Tipado estricto con *Type Guards* en tiempo de ejecución para validación de estructuras en `localStorage`. |
| **Bundler & Dev** | `Vite 6.2.0` | Servidor de desarrollo ultrarrápido con HMR (`< 400ms`) y compilación para producción en `~2.0s`. |
| **Estilos** | `Tailwind CSS 4.0.9` | Directivas `@theme`, variables semánticas, animaciones fluidas y clases de utilidad. |
| **Iconografía** | `lucide-react 0.475.0` | Iconos vectoriales consistentes sin emojis para controles técnicos. |
| **Criptografía** | `Web Crypto API (Subtle)` | Hashing de credenciales con `PBKDF2`, `SHA-256`, 100,000 iteraciones y salt criptográfico por usuario. |
| **Audio** | `Web Speech API` | Transcripción por voz (`webkitSpeechRecognition`) y síntesis de voz en tiempo real. |
| **CI/CD** | `GitLab CI/CD` | Pipeline automatizado con caché de dependencias `.npm` y compilación en runner Alpine Linux. |

---

## 🛡️ Seguridad y Calidad de Código (Hardening)

El proyecto implementa las directivas de seguridad **STRIDE** y revisión de **5 Ejes de Calidad**:

* **SEC-01 (Contraseñas Seguras):** Las contraseñas nunca se almacenan en texto plano; se derivan usando PBKDF2-SHA256 con 100k iteraciones.
* **SEC-02 (Rate Limiting en Frontend):** Bloqueo automático tras 5 intentos fallidos en 5 minutos para evitar ataques de fuerza bruta.
* **SEC-03 (Anti-Path Traversal & DoS):** Validación estricta de nombres de archivo dentro del `.rar` neutralizando secuencias `../` y limitando el tamaño a 25 MB.
* **SEC-04 (Sesiones con TTL):** Sesiones locales con expiración automática de 12 horas y opción de borrado completo de datos personales (GDPR).
* **SEC-05 (CSP Strict):** Cabeceras `Content-Security-Policy`, `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`.
* **CR-04 (Performance Bundle):** División de módulos con carga diferida (`React.lazy`), manteniendo el paquete principal en menos de 350 kB.

---

## 🌿 Estrategia de Ramas en Git

El repositorio sigue un flujo estructurado de dos ramas para garantizar estabilidad en producción:

| Rama | Propósito | Despliegue Automático | Acceso |
| :--- | :--- | :---: | :--- |
| **`main`** | **Rama Oficial de Producción.** Contiene el código estable y probado. | ✅ **Sí** (Despliega en GitLab Pages) | Protegida |
| **`testing`** | **Rama de Pruebas y Experimentación.** Aquí se integran nuevas funciones antes de ir a producción. | ❌ No afecta producción | Libre para pruebas |

### Flujo de Trabajo Recomendado:

```bash
# 1. Posicionarse en la rama de pruebas para realizar experimentos
git checkout testing

# 2. Realizar cambios y probar localmente
npm run dev

# 3. Compilar para verificar que no hay errores de TypeScript
npm run build

# 4. Guardar los cambios en la rama de pruebas
git add .
git commit -m "feat(modulo): descripcion del experimento"
git push origin testing

# 5. Cuando las pruebas sean satisfactorias, integrar a main para publicar
git checkout main
git merge testing
git push origin main
```

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos:
* **Node.js:** Versión 20.x o superior.
* **NPM:** Versión 10.x o superior.

```bash
# 1. Clonar el repositorio
git clone https://gitlab.com/SuarezCaceres/ai-skills-studio.git
cd ai-skills-studio

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
# Acceder en: http://localhost:5173/

# 4. Compilar para producción (validación de TypeScript + Vite)
npm run build

# 5. Previsualizar la compilación de producción localmente
npm run preview
```

---

## 📁 Estructura del Proyecto

```text
ai-skills-studio/
├── .gitlab-ci.yml             # Pipeline de CI/CD para GitLab Pages
├── .gitignore                 # Reglas de exclusión (node_modules, dist, etc.)
├── Códice Neuronal - MOC.md   # Mapa de conocimiento para Obsidian (MOC)
├── package.json               # Dependencias y scripts de construcción
├── tsconfig.json              # Configuración del compilador TypeScript
├── vite.config.ts             # Configuración de Vite, plugins y cabeceras CSP
├── index.html                 # Punto de entrada HTML con CSP y metaetiquetas
├── src/
│   ├── App.tsx                # Orquestador principal, rutas y suspense
│   ├── main.tsx               # Montaje en el DOM
│   ├── index.css              # Variables de tema Cyber Dark y animaciones
│   ├── components/            # Componentes visuales y módulos funcionales
│   │   ├── AIModelBenchmarkPanel.tsx    # Comparador y radar de los 7 modelos IA
│   │   ├── AuthScreen.tsx               # Modal de inicio de sesión con PBKDF2
│   │   ├── BrandIcons.tsx               # SVGs oficiales temáticos (Claude, Gemini, GPT)
│   │   ├── CodiceStudio.tsx             # Suite Cyber Dark de alta densidad
│   │   ├── ContextEvidenceLogger.tsx     # Galería visual de capturas y evidencias
│   │   ├── InformativeLandingSection.tsx # Página de inicio y selector de modelos
│   │   ├── MarkdownViewerTranslator.tsx  # Visor y traductor de Markdown
│   │   ├── NavbarActiveSkill.tsx         # Barra de navegación flotante y drawer
│   │   ├── NeuralAtmosphereBackground.tsx# Canvas 2D con red neuronal reactiva
│   │   ├── RarArchiveExplorer.tsx        # Explorador y visor de archivos .RAR
│   │   ├── SkillManager.tsx              # Gestor y editor de skills de IA
│   │   ├── StylePresetCatalog.tsx        # Catálogo de componentes y presets
│   │   ├── UIComponentPreview.tsx        # Previsualizador en vivo de UI/UX
│   │   ├── UnifiedProjectStudio.tsx      # Inspector unificado de proyectos
│   │   └── VoiceVisualFeedback.tsx       # Reconocimiento y síntesis por voz
│   ├── data/                  # Catálogos estáticos y colecciones de datos
│   │   ├── aiModelsData.ts               # Métricas de los modelos de IA
│   │   ├── frameworkCollectionsData.tsx  # Colecciones de frameworks y píldoras
│   │   ├── initialSkills.ts              # Skills predeterminadas del sistema
│   │   └── stylePresets.ts               # Presets de componentes UI/UX
│   ├── services/              # Lógica de procesamiento y servicios
│   │   ├── rarParserService.ts           # Descompresor binario de paquetes .RAR
│   │   ├── speechService.ts              # Servicio de voz Web Speech API
│   │   └── translationService.ts         # Traducción algorítmica de Markdown
│   ├── types/                 # Definiciones de tipos TypeScript
│   │   ├── skill.ts                      # Interfaces de skills y componentes
│   │   └── workspace.ts                  # Rutas, modelos y cuentas de usuario
│   └── utils/                 # Utilidades de seguridad y validación
│       └── securityHardening.ts          # PBKDF2, rate limiting, anti-traversal
```

---

## 📄 Licencia

Este proyecto está disponible para fines educativos y de investigación en ingeniería de IA.
Desarrollado y mantenido por **Sergio Suarez** ([@SuarezCaceres](https://gitlab.com/SuarezCaceres)).
