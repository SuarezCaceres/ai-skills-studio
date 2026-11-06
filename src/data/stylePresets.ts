import {
  PresetAIModelName,
  PresetModelVariation,
  UIStylePreset,
} from '../types/skill';

function buildSevenModelVariations(
  presetTitle: string,
  primarySpecialty: string
): Record<PresetAIModelName, PresetModelVariation> {
  return {
    'Opus 5.5': {
      modelName: 'Opus 5.5',
      family: 'Claude Opus',
      tier: 'Cortex Supremo · 100% Razonamiento',
      visualDifference: `En "${presetTitle}", Opus 5.5 esculpe una jerarquía espacial en 3 capas sobre Azul Noche (#0A0F1D) con contraste AAA, sombras calibradas y acentos #0EA5E9 de precisión quirúrgica.`,
      structureDifference:
        'Arquitectura desacoplada con estados WAI-ARIA completos, gestión de foco por teclado y validación estricta sin efectos secundarios.',
      promptAdaptation: `## Optimización Claude Opus 5.5 (${primarySpecialty})\n- Aplicar sistema de elevación triple sobre \`#0A0F1D\` y \`#0F172A\`.\n- Garantizar navegación por teclado completa (\`ArrowUp\`, \`ArrowDown\`, \`Escape\`) y contraste AAA.`,
    },
    'Opus 4.8': {
      modelName: 'Opus 4.8',
      family: 'Claude Opus',
      tier: 'Ultra · 98% Estabilidad Estructural',
      visualDifference: `En "${presetTitle}", Opus 4.8 prioriza una retícula ortogonal sobria, bordes técnicos de 1px altamente definidos y lectura de larga duración sin fatiga visual.`,
      structureDifference:
        'Contratos TypeScript conservadores, separación estricta entre estado de presentación y lógica de dominio.',
      promptAdaptation: `## Optimización Claude Opus 4.8 (${primarySpecialty})\n- Estructurar cuadrícula simétrica de alta estabilidad y tipografía técnica limpia.\n- Mantener tokens de color consistentes en estados \`hover\` y \`focus-visible\`.`,
    },
    'Gemini 3.8': {
      modelName: 'Gemini 3.8',
      family: 'Gemini',
      tier: 'Ultra / Máximo · 178 tok/s (2M Contexto)',
      visualDifference: `En "${presetTitle}", Gemini 3.8 despliega micro-interacciones a 60fps, destellos neuronales dinámicos en cian eléctrico (#0EA5E9) y telemetría visual en tiempo real.`,
      structureDifference:
        'Uso de CSS Grid moderno, variables reactivas en vivo y contenedores semánticos nativos (<dialog>, <search>, <figure>).',
      promptAdaptation: `## Optimización Gemini 3.8 (${primarySpecialty})\n- Renderizar transiciones reactivas e indicadores de telemetría en tiempo real.\n- Sincronizar variables de color en vivo con latencia cero.`,
    },
    'Gemini 3.7': {
      modelName: 'Gemini 3.7',
      family: 'Gemini',
      tier: 'Máximo / Alto · 164 tok/s',
      visualDifference: `En "${presetTitle}", Gemini 3.7 optimiza la fluidez en pantallas compactas y móviles con superficies ligeras y legibilidad instantánea.`,
      structureDifference:
        'Árbol DOM ultraligero optimizado para carga inmediata y respuesta táctil ágil.',
      promptAdaptation: `## Optimización Gemini 3.7 (${primarySpecialty})\n- Minimizar profundidad de nodos DOM y priorizar diseño responsivo móvil-primero.`,
    },
    'Sonnet 5.5': {
      modelName: 'Sonnet 5.5',
      family: 'Claude Sonnet',
      tier: 'Máximo / Alto · 100% Ingeniería UI',
      visualDifference: `En "${presetTitle}", Sonnet 5.5 logra un acabado de estudio tipo Apple/Linear con cristal esmerilado oscuro (backdrop-blur), píldoras de atajos y botones emergentes suaves.`,
      structureDifference:
        'Componentes funcionales en React 19 + Tailwind CSS con composición limpia y hooks reutilizables.',
      promptAdaptation: `## Optimización Claude Sonnet 5.5 (${primarySpecialty})\n- Refinar micro-interacciones de hover, anillos de enfoque cian eléctrico y píldoras de atajos (\`Ctrl+K\`).`,
    },
    'GPT Astra': {
      modelName: 'GPT Astra',
      family: 'GPT',
      tier: 'Cortex Supremo · Síntesis Futurista',
      visualDifference: `En "${presetTitle}", GPT Astra introduce estética de comando espacial con indicadores energéticos, badges de alto impacto ejecutivo y contrastes vibrantes.`,
      structureDifference:
        'Patrón modular orientado a paneles de control multi-agente y widgets de estado.',
      promptAdaptation: `## Optimización GPT Astra (${primarySpecialty})\n- Incorporar insignias de telemetría ejecutiva y acentos luminosos de alto contraste.`,
    },
    'GPT Luna': {
      modelName: 'GPT Luna',
      family: 'GPT',
      tier: 'Máximo / Alto · Estética Nocturna Lunar',
      visualDifference: `En "${presetTitle}", GPT Luna suaviza las transiciones lumínicas sobre el fondo Azul Noche creando una atmósfera nocturna orgánica y envolvente.`,
      structureDifference:
        'Enfoque en ergonomía visual, espaciado generoso y retroalimentación asistida por voz.',
      promptAdaptation: `## Optimización GPT Luna (${primarySpecialty})\n- Calibrar luminancias nocturnas suaves sobre \`#0A0F1D\` con resplandores cálidos en \`#38BDF8\`.`,
    },
  };
}

export const STYLE_PRESETS: UIStylePreset[] = [
  {
    id: 'preset-saas-analytics',
    name: 'Panel de Telemetría Neuronal SaaS',
    category: 'Analítica SaaS',
    styleCategory: 'Cristal Oscuro + Azul Noche',
    mode: 'Dark',
    colors: ['#0EA5E9', '#38BDF8', '#10B981', '#0F172A'],
    theme: 'cyan',
    componentType: 'menubar',
    heroTitle: 'Transforma Señales en',
    heroAccent: 'Decisiones Ejecutivas',
    heroSubtitle:
      'Barra de menús analítica que monitorea embudos de conversión, latencia de agentes y métricas en tiempo real.',
    badgeText: 'Telemetría en Vivo',
    metrics: ['10K+ Nodos', '99.9% Activo', '50M+ Eventos'],
    defaultAiModel: 'Gemini 3.8',
    skillsApplied: [
      {
        skillId: 'ui-ux-pro-max',
        description:
          'Paleta Azul Noche (#0F172A) con acentos estratégicos #0EA5E9 y jerarquía de KPIs.',
      },
      {
        skillId: 'modern-web-guidance',
        description:
          'Navegación por teclado en role="menubar" y sincronización aria-expanded.',
      },
    ],
    modelVariations: buildSevenModelVariations(
      'Panel de Telemetría Neuronal SaaS',
      'Analítica en Tiempo Real'
    ),
    menuItems: [
      {
        id: 'saas-1',
        label: 'Métricas Clave',
        shortcut: 'Alt+M',
        checked: true,
        children: [
          {
            id: 'saas-1a',
            label: 'Rastreador de Conversión en Vivo',
            shortcut: 'Ctrl+1',
            checked: true,
          },
          {
            id: 'saas-1b',
            label: 'Matriz de Retención de Cohortes',
            shortcut: 'Ctrl+2',
          },
        ],
      },
      {
        id: 'saas-2',
        label: 'Tablero Cortex',
        shortcut: 'Alt+D',
        children: [
          {
            id: 'saas-2a',
            label: 'Flujo de Tokens y Latencia',
            shortcut: 'Ctrl+R',
            checked: true,
          },
          {
            id: 'saas-2b',
            label: 'Exportar Reporte Markdown',
            shortcut: 'Ctrl+E',
          },
        ],
      },
      {
        id: 'saas-3',
        label: 'Integración API',
        shortcut: 'Alt+P',
        children: [
          {
            id: 'saas-3a',
            label: 'Configurar Llaves de Agente',
            shortcut: 'Ctrl+K',
          },
        ],
      },
    ],
    promptMarkdown: `---
name: panel-telemetria-neuronal-saas
description: Diseña y genera menús de barras accesibles, menús desplegables con navegación por teclado y barras de comandos dinámicas en Cyber Dark y Cian Eléctrico.
---

# Arquitecto de Componentes UI y Menús Interactivos

## Propósito de la Skill
Diseña un panel analítico SaaS con estética de Cristal Oscuro sobre Cyber Dark (#030712), acentos cian eléctrico (#0EA5E9) y barra de menús interactiva para KPIs en tiempo real.

## Instrucciones para el Agente de IA
1. Utiliza siempre elementos semánticos nativos (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Sincroniza el estado \`aria-expanded\` en cada disparador de menú desplegable.
3. Incluye atajos de teclado claros y soporte para cerrar con la tecla \`Escape\`.`,
  },
  {
    id: 'preset-education',
    name: 'Academia de Ingeniería IA',
    category: 'Educación',
    styleCategory: 'Atmósfera Neuronal + Alto Contraste',
    mode: 'Dark',
    colors: ['#38BDF8', '#38BDF8', '#10B981', '#0A0F1D'],
    theme: 'emerald',
    componentType: 'menubar',
    heroTitle: 'Domina Arquitecturas IA,',
    heroAccent: 'Paso a Paso en Vivo',
    heroSubtitle:
      'Navegación curricular interactiva con bloques de lectura descansada e indicadores de progreso por módulo.',
    badgeText: 'Ruta de Especialización',
    metrics: ['120+ Módulos', 'Lectura Cómoda', 'Mentoría IA'],
    defaultAiModel: 'Opus 5.5',
    skillsApplied: [
      {
        skillId: 'ui-ux-pro-max',
        description:
          'Atmósfera educativa con patrón neuronal y tarjetas de lectura de alto confort.',
      },
      {
        skillId: 'angular-tutor',
        description:
          'Estructura pedagógica progresiva por bloques y micro-evaluaciones.',
      },
    ],
    modelVariations: buildSevenModelVariations(
      'Academia de Ingeniería IA',
      'Plataforma Educativa Interactiva'
    ),
    menuItems: [
      {
        id: 'edu-1',
        label: 'Rutas de Estudio',
        shortcut: 'Alt+C',
        checked: true,
        children: [
          {
            id: 'edu-1a',
            label: 'Ingeniería de Prompts & Agentes',
            shortcut: '↵',
            checked: true,
          },
          {
            id: 'edu-1b',
            label: 'Arquitectura Full-Stack TypeScript',
            shortcut: 'Ctrl+U',
          },
        ],
      },
      {
        id: 'edu-2',
        label: 'Laboratorios',
        shortcut: 'Alt+L',
        children: [
          {
            id: 'edu-2a',
            label: 'Práctica Guiada en Vivo',
            shortcut: 'Ctrl+M',
            checked: true,
          },
        ],
      },
      {
        id: 'edu-3',
        label: 'Certificación',
        shortcut: 'Alt+P',
        children: [
          {
            id: 'edu-3a',
            label: 'Evaluar Proyecto .RAR',
            shortcut: 'Ctrl+G',
          },
        ],
      },
    ],
    promptMarkdown: `---
name: academia-ingenieria-ia
description: Estructura menús educativos claros con progreso de módulos, rutas de aprendizaje y accesibilidad por teclado.
---

# Sistema de Navegación para Plataforma Educativa IA

## Propósito de la Skill
Construye una barra de navegación curricular con estética Cyber Dark (#030712) y acentos Cian (#38BDF8) que facilite a los estudiantes explorar módulos y laboratorios sin fricción visual.

## Instrucciones de Implementación
1. Destaca la ruta activa con acentos de alto contraste (\`#0EA5E9\`).
2. Organiza las categorías en submenús desplegables claros con indicadores de progreso.`,
  },
  {
    id: 'preset-fintech',
    name: 'Bóveda Cripto & Liquidez Cuántica',
    category: 'Fintech',
    styleCategory: 'Modo Oscuro OLED + Brillo Cian',
    mode: 'Dark',
    colors: ['#0EA5E9', '#38BDF8', '#10B981', '#0A0F1D'],
    theme: 'cyan',
    componentType: 'dropdown',
    heroTitle: 'Custodia de Activos de',
    heroAccent: 'Grado Institucional',
    heroSubtitle:
      'Menú desplegable de ejecución rápida con telemetría de liquidez, auditoría criptográfica y latencia sub-milisegundo.',
    badgeText: 'Seguridad Auditada',
    metrics: ['$50B+ Custodia', '150+ Redes', '0.01s Ejecución'],
    defaultAiModel: 'Sonnet 5.5',
    skillsApplied: [
      {
        skillId: 'ui-ux-pro-max',
        description:
          ' Contraste OLED sobre #030712 con acentos cian (#0EA5E9) para terminales financieras.',
      },
      {
        skillId: 'modern-web-guidance',
        description:
          'Menú desplegable seguro con gestión de foco y confirmación explícita de órdenes.',
      },
    ],
    modelVariations: buildSevenModelVariations(
      'Bóveda Cripto & Liquidez Cuántica',
      'Terminal Financiera de Baja Latencia'
    ),
    menuItems: [
      {
        id: 'fin-1',
        label: 'Ejecutar Orden Instantánea (BTC / ETH)',
        shortcut: 'Ctrl+T',
        checked: true,
      },
      {
        id: 'fin-2',
        label: 'Inspeccionar Bóveda Fría Multi-Firma',
        shortcut: 'Ctrl+W',
        checked: true,
      },
      {
        id: 'fin-3',
        label: 'Exportar Auditoría de Transacciones',
        shortcut: 'Ctrl+L',
      },
    ],
    promptMarkdown: `---
name: boveda-cripto-liquidez
description: Genera menús desplegables en modo oscuro profundo con estética financiera de alta precisión.
---

# Menú Desplegable de Terminal Fintech en Azul Noche

## Propósito de la Skill
Proporciona un menú desplegable de baja latencia visual sobre fondo \`#0A0F1D\`, bordes luminosos sutiles y tipografía monoespaciada para métricas de precisión.

## Reglas de Diseño
1. Fondo oscuro profundo \`#0A0F1D\` con tarjetas \`#0F172A\` y acentos \`#0EA5E9\`.
2. Indicadores de estado claros y atajos de teclado directos para operadores.`,
  },
  {
    id: 'preset-developer-cli',
    name: 'Consola de Agentes Autónomos CLI',
    category: 'Herramientas Dev',
    styleCategory: 'Terminal Cibernética + Cian Neón',
    mode: 'Dark',
    colors: ['#0EA5E9', '#10B981', '#38BDF8', '#0A0F1D'],
    theme: 'emerald',
    componentType: 'command-palette',
    heroTitle: 'Orquesta Enjambres IA',
    heroAccent: 'a Velocidad de Terminal',
    heroSubtitle:
      'Paleta de comandos instantánea para compilar paquetes .RAR, invocar subagentes y auditar árboles de código.',
    badgeText: 'Motor CLI v4.2',
    metrics: ['0.3ms Respuesta', '100% Tipado', 'Zero-Config'],
    defaultAiModel: 'GPT Astra',
    skillsApplied: [
      {
        skillId: 'google-antigravity-sdk',
        description:
          'Orquestación de subagentes y ejecución de comandos desde paleta rápida.',
      },
      {
        skillId: 'modern-web-guidance',
        description:
          'Uso de bloques <pre tabindex="0"><code> y navegación rápida por teclado.',
      },
    ],
    modelVariations: buildSevenModelVariations(
      'Consola de Agentes Autónomos CLI',
      'Paleta de Comandos para Desarrolladores'
    ),
    menuItems: [
      {
        id: 'dev-1',
        label: 'agy build --verificar-paquete-rar',
        shortcut: 'Ctrl+B',
        checked: true,
      },
      {
        id: 'dev-2',
        label: 'agy sync --traducir-markdown-es',
        shortcut: 'Ctrl+S',
        checked: true,
      },
      {
        id: 'dev-3',
        label: 'agy test --auditoria-accesibilidad-aria',
        shortcut: 'Ctrl+T',
      },
    ],
    promptMarkdown: `---
name: consola-agentes-cli
description: Crea paletas de comandos rápidas estilo IDE con atajos de teclado y estética de terminal moderna.
---

# Paleta de Comandos para Orquestación de Agentes

## Propósito de la Skill
Implementa una paleta de comandos rápida (\`Command Palette\`) optimizada para desarrolladores que necesitan disparar compilaciones, traducciones y diagnósticos sin soltar el teclado.`,
  },
  {
    id: 'preset-creative-suite',
    name: 'Estudio Creativo de Diseño Generativo',
    category: 'Diseño & Medios',
    styleCategory: 'Acento Coral & Cian + Lienzo Nocturno',
    mode: 'Dark',
    colors: ['#0EA5E9', '#F43F5E', '#A855F7', '#0F172A'],
    theme: 'rose',
    componentType: 'toolbar',
    heroTitle: 'Diseña Interfaces que',
    heroAccent: 'Cautivan al Instante',
    heroSubtitle:
      'Barra de herramientas flotante para ajustar paletas cromáticas, capas vectoriales y prototipos interactivos en vivo.',
    badgeText: 'Lienzo Generativo',
    metrics: ['60 FPS Fluidez', 'Color P3', 'Exportación SVG'],
    defaultAiModel: 'GPT Luna',
    skillsApplied: [
      {
        skillId: 'ui-ux-pro-max',
        description:
          'Barra flotante ergonómica con degradados cálidos y retroalimentación táctil.',
      },
      {
        skillId: 'modern-web-guidance',
        description:
          'Agrupación accesible de herramientas creativas con etiquetas ARIA claras.',
      },
    ],
    modelVariations: buildSevenModelVariations(
      'Estudio Creativo de Diseño Generativo',
      'Barra Flotante para Diseño UI/UX'
    ),
    menuItems: [
      {
        id: 'cre-1',
        label: 'Inyectar Paleta Cyber Dark & Cian',
        shortcut: ' Alt+1',
        checked: true,
      },
      {
        id: 'cre-2',
        label: 'Generar Retícula Bento Responsiva',
        shortcut: 'Alt+2',
        checked: true,
      },
      {
        id: 'cre-3',
        label: 'Exportar Tokens de Diseño CSS',
        shortcut: 'Alt+3',
      },
    ],
    promptMarkdown: `---
name: estudio-creativo-generativo
description: Diseña barras de herramientas flotantes para suites creativas y editores visuales en tiempo real.
---

# Barra de Herramientas Flotante para Laboratorio Visual

## Propósito de la Skill
Construye una barra de acción flotante (\`Toolbar\`) con estética nocturna sofisticada y acentos vibrantes para manipular propiedades visuales de componentes en vivo.`,
  },
  {
    id: 'preset-ai-command-hub',
    name: 'Núcleo de Control Multi-Modelo IA',
    category: 'Orquestación IA',
    styleCategory: 'Cyber Dark Profundo + Cian Solar',
    mode: 'Dark',
    colors: ['#0EA5E9', '#38BDF8', '#38BDF8', '#0A0F1D'],
    theme: 'indigo',
    componentType: 'menubar',
    heroTitle: 'Sincroniza Todos tus',
    heroAccent: 'Motores de Inteligencia',
    heroSubtitle:
      'Centro de mando unificado para conmutar entre Opus 5.5, Gemini 3.8, Sonnet 5.5 y GPT Astra con trazabilidad completa.',
    badgeText: 'Cortex Sincronizado',
    metrics: ['7 Versiones IA', '100% Español', 'Dictado por Voz'],
    defaultAiModel: 'Opus 4.8',
    skillsApplied: [
      {
        skillId: 'google-antigravity-sdk',
        description:
          'Enrutamiento inteligente entre versiones de modelos según la complejidad visual.',
      },
      {
        skillId: 'ui-ux-pro-max',
        description:
          'Diseño de centro de control en Cyber Dark (#030712) con indicadores de estado cian.',
      },
    ],
    modelVariations: buildSevenModelVariations(
      'Núcleo de Control Multi-Modelo IA',
      'Orquestador de Modelos IA'
    ),
    menuItems: [
      {
        id: 'hub-1',
        label: 'Conmutar Motor',
        shortcut: 'Alt+M',
        checked: true,
        children: [
          {
            id: 'hub-1a',
            label: 'Activar Claude Opus 5.5 (Cortex Supremo)',
            shortcut: 'Ctrl+1',
            checked: true,
          },
          {
            id: 'hub-1b',
            label: 'Activar Gemini 3.8 (2M Contexto)',
            shortcut: 'Ctrl+2',
          },
          {
            id: 'hub-1c',
            label: 'Activar GPT Astra / GPT Luna',
            shortcut: 'Ctrl+3',
          },
        ],
      },
      {
        id: 'hub-2',
        label: 'Auditoría Visual',
        shortcut: 'Alt+V',
        children: [
          {
            id: 'hub-2a',
            label: 'Iniciar Evaluación con Dictado por Voz',
            shortcut: 'Ctrl+D',
            checked: true,
          },
        ],
      },
      {
        id: 'hub-3',
        label: 'Sincronizar .RAR',
        shortcut: 'Alt+R',
        children: [
          {
            id: 'hub-3a',
            label: 'Guardar Estado en el Códice Neuronal',
            shortcut: 'Ctrl+S',
          },
        ],
      },
    ],
    promptMarkdown: `---
name: nucleo-control-multimodelo-ia
description: Centro de mando interactivo para comparar versiones específicas de modelos IA (Opus 5.5, Gemini 3.8, Sonnet 5.5, GPT Astra y GPT Luna).
---

# Núcleo de Control para Matriz de Inteligencias

## Propósito de la Skill
Proporciona una interfaz de mando en Cyber Dark (\`#030712\`) y Cian Eléctrico (\`#0EA5E9\`) para alternar entre motores de IA, inspeccionar su impacto visual y registrar evaluaciones por voz.`,
  },
];

export const STYLE_PRESET_CATALOG = STYLE_PRESETS;
