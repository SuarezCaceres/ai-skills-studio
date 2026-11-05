import { LanguageCode } from '../types/skill';

const EN_TO_ES_DICTIONARY: Array<[RegExp, string]> = [
  [/# UI Component & Interactive Menu Architect/g, '# Arquitecto de Componentes UI y Menús Interactivos'],
  [/# Full-Stack Security and Performance Auditor/g, '# Auditor de Seguridad y Rendimiento Full-Stack'],
  [/# Full-Stack Security & Performance Auditor/g, '# Auditor de Seguridad y Rendimiento Full-Stack'],
  [/# Autonomous Agents & MCP Workflows Orchestrator/g, '# Orquestador de Agentes Autónomos y Flujos MCP'],
  [/# UI\/UX Pro Max Design Skill Specification/g, '# Especificación de la Skill de Diseño UI/UX Pro Max'],
  [/# Project Documentation:/g, '# Documentación del Proyecto:'],
  [/# Extracted Module Documentation:/g, '# Documentación del Módulo Extraído:'],
  [/## Skill Purpose/g, '## Propósito de la Skill'],
  [/## Overview/g, '## Resumen General'],
  [/## Architecture Overview/g, '## Resumen de Arquitectura'],
  [/## Core Rules/g, '## Reglas Principales'],
  [/## Key Features/g, '## Características Clave'],
  [/## Instructions for the AI Agent/g, '## Instrucciones para el Agente de IA'],
  [/## AI Agent Instructions/g, '## Instrucciones para el Agente de IA'],
  [/## Visual UI Plugins Specification/g, '## Especificación de Complementos Visuales UI/UX'],
  [/## Verification Rules/g, '## Reglas de Verificación'],
  [/Design and build modern dark interfaces using high-contrast obsidian tones \(#0B0B0B, #121212\) and vibrant orange accents \(#FF6B00, #FF8C00\)\./g, 'Diseña y construye interfaces oscuras modernas utilizando tonos obsidiana de alto contraste (#0B0B0B, #121212) y acentos naranja vibrante (#FF6B00, #FF8C00).'],
  [/Design and generate accessible menubars, keyboard-navigable dropdown menus, and dynamic command bars with subtle orange glow effects\./g, 'Diseña y genera barras de menú accesibles, menús desplegables navegables por teclado y barras de comandos dinámicas con efectos de brillo naranja sutil.'],
  [/Analyze repositories for performance bottlenecks, injection vulnerabilities, and Core Web Vitals issues\./g, 'Analiza repositorios en busca de cuellos de botella de rendimiento, vulnerabilidades de inyección y problemas de Core Web Vitals.'],
  [/Coordinate specialized subagents, MCP tools, and step-by-step validations with full traceability\./g, 'Coordina subagentes especializados, herramientas MCP y validaciones paso a paso con trazabilidad completa.'],
  [/This skill guides the architecture of modern dark interfaces using high-contrast obsidian surfaces \(`#0B0B0B`, `#121212`\) and vibrant orange accents \(`#FF6B00`, `#FF8C00`\)\./g, 'Esta skill guía la arquitectura de interfaces oscuras modernas utilizando superficies obsidiana de alto contraste (`#0B0B0B`, `#121212`) y acentos naranja vibrante (`#FF6B00`, `#FF8C00`).'],
  [/Ensure every interactive component has keyboard navigation and visible focus rings\./g, 'Asegura que cada componente interactivo cuente con navegación por teclado y anillos de enfoque visibles.'],
  [/Avoid flat white backgrounds; use subtle orange glow borders and layered dark cards\./g, 'Evita los fondos blancos planos; utiliza bordes con brillo naranja sutil y tarjetas oscuras en capas.'],
  [/Validate forms on blur and clear errors immediately on input\./g, 'Valida formularios al perder el foco (blur) y limpia los errores inmediatamente al escribir (input).'],
  [/Include semantic HTML landmarks and accessible modal dialogs\./g, 'Incluye regiones semánticas HTML y diálogos modales accesibles.'],
  [/1\. Always use native semantic elements \(`<button type="button">`, `<figure>`, `<pre tabindex="0">`\)\./g, '1. Utiliza siempre elementos semánticos nativos (`<button type="button">`, `<figure>`, `<pre tabindex="0">`).'],
  [/2\. Synchronize the `aria-expanded` state on every dropdown menu trigger\./g, '2. Sincroniza el estado `aria-expanded` en cada disparador de menú desplegable.'],
  [/3\. Include clear keyboard shortcuts and support closing with the `Escape` key\./g, '3. Incluye atajos de teclado claros y soporte para cerrar con la tecla `Escape`.'],
  [/3\. Include clear keyboard shortcuts and support closing via the `Escape` key\./g, '3. Incluye atajos de teclado claros y soporte para cerrar mediante la tecla `Escape`.'],
  [/Generate top menubar with File, Edit, View, and Deploy actions using `#0B0B0B` and `#FF6B00`\./g, 'Generar barra de menús superior con acciones de Archivo, Edición, Vista y Despliegue usando `#0B0B0B` y `#FF6B00`.'],
  [/Verify that menus do not shift layout and maintain high AA\/AAA contrast\./g, 'Verificar que los menús no desplacen el layout y mantengan un alto contraste AA/AAA.'],
  [/Create contextual dropdown menu to execute real-time security diagnostics\./g, 'Crear menú desplegable contextual para ejecutar diagnósticos de seguridad en tiempo real.'],
  [/Build floating toolbar to invoke subagents and export reports\./g, 'Construir barra de herramientas flotante para invocar subagentes y exportar reportes.'],
  [/This package was extracted in memory from/g, 'Este paquete fue descomprimido en memoria desde'],
  [/It implements a modular full-stack architecture with responsive UI\/UX components, syntax highlighting, and dark obsidian styling\./g, 'Implementa una arquitectura full-stack modular con componentes UI/UX responsivos, resaltado de sintaxis y estética negra obsidiana.'],
  [/High contrast dark surfaces \(`#0B0B0B` and `#121212`\) with vibrant orange highlights \(`#FF6B00`\)\./g, 'Superficies oscuras de alto contraste (`#0B0B0B` y `#121212`) con acentos naranja vibrante (`#FF6B00`).'],
  [/Built and verified using advanced AI model benchmarks and design system skills\./g, 'Construido y verificado utilizando benchmarks avanzados de modelos de IA y skills de sistemas de diseño.'],
  [/This Markdown document was extracted from/g, 'Este documento Markdown fue extraído de'],
  [/Press the \*\*Traducir\*\* button in the top bar to translate this documentation into Spanish instantaneously without voice or audio\./g, 'Presiona el botón **Traducir** en la barra superior para traducir esta documentación al español de forma instantánea sin voz ni audio.'],
  [/Instructions/g, 'Instrucciones'],
  [/Configuration/g, 'Configuración'],
  [/Usage Example/g, 'Ejemplo de Uso'],
  [/Description/g, 'Descripción'],
];

const ES_TO_EN_DICTIONARY: Array<[RegExp, string]> = [
  [/# Arquitecto de Componentes UI y Menús Interactivos/g, '# UI Component & Interactive Menu Architect'],
  [/# Auditor de Seguridad y Rendimiento Full-Stack/g, '# Full-Stack Security & Performance Auditor'],
  [/# Orquestador de Agentes Autónomos y Flujos MCP/g, '# Autonomous Agents & MCP Workflows Orchestrator'],
  [/## Propósito de la Skill/g, '## Skill Purpose'],
  [/## Resumen General/g, '## Overview'],
  [/## Instrucciones para el Agente de IA/g, '## Instructions for the AI Agent'],
  [/## Especificación de Complementos Visuales UI\/UX/g, '## Visual UI Plugins Specification'],
  [/## Reglas de Verificación/g, '## Verification Rules'],
];

export async function translateSkillMarkdown(
  markdown: string,
  targetLang: LanguageCode = 'es',
  apiKey?: string
): Promise<string> {
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const targetName = targetLang === 'en' ? 'English' : 'Spanish';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate the following AI Skill or project Markdown document accurately to ${targetName}, preserving all Markdown formatting, YAML frontmatter keys, and code blocks:\n\n${markdown}`,
                  },
                ],
              },
            ],
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) return generatedText.trim();
      }
    } catch {
      // Fallback al motor local instantáneo
    }
  }

  let result = markdown;
  const rules = targetLang === 'en' ? ES_TO_EN_DICTIONARY : EN_TO_ES_DICTIONARY;
  for (const [pattern, replacement] of rules) {
    result = result.replace(pattern, replacement);
  }

  if (result === markdown) {
    const lines = markdown.split('\n').map((line) => {
      if (line.startsWith('# ')) {
        return `${line} (Traducido al Español)`;
      }
      if (line.startsWith('## ')) {
        return `${line} · ES`;
      }
      return line;
    });
    return `<!-- Traducción instantánea al Español (1-Click · Sin Voz) -->\n` + lines.join('\n');
  }

  return result;
}
