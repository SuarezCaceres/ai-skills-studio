---
id: skill-claude-memory-system
title: "Sistema de Memoria Persistente & Hooks para Agentes IA"
category: "Arquitectura de Agentes"
level: "Principiante"
kind: "guia"
model: "Claude / Sonnet (Máximo / Alto)"
tags:
  - "#skill"
  - "#skill/architecture"
  - "#modern-web-guidance"
  - "#hooks"
  - "#typescript"
  - "#memoria"
updated: "2026-11-05"
---

# Sistema de Memoria Persistente & Hooks para Agentes IA

> [!NOTE] Propósito
> Arquitectura TypeScript y CSS que configura reglas persistentes, menús desplegables de contexto y hooks automáticos con inspección de código en árbol `.RAR`.

## Conexiones y Módulos Relacionados
- [[Códice Neuronal - MOC|Mapa de Contenidos Principal (MOC)]]
- [[skills/auditor-de-conversiones|Auditor de Conversiones & Sistema UI]]
- [[skills/multi-agent-orchestrator|Autonomous Multi-Agent Orchestrator]]
- [[REPORTE_SEGURIDAD_Y_CALIDAD|Auditoría de Seguridad y Calidad]]

---

## 1. Especificación del Agente (`SKILL.md`)

```markdown
---
name: fullstack-security-auditor
description: Analyze repositories for performance bottlenecks, injection vulnerabilities, and Core Web Vitals issues.
---

# Full-Stack Security and Performance Auditor

## Skill Purpose
Analyze repositories for performance bottlenecks, injection vulnerabilities, and Core Web Vitals issues.

## Instructions for the AI Agent
1. Always use native semantic elements (<button type="button">, <figure>, <pre tabindex="0">).
2. Synchronize the aria-expanded state on every dropdown menu trigger.
3. Include clear keyboard shortcuts and support closing with the Escape key.

## Visual UI Plugins Specification
- Create contextual dropdown menu to execute real-time security diagnostics.
```

---

## 2. Puntos Clave de Implementación
- Inyección de memoria contextual desde sesión local cifrada.
- Verificación de TTL de 12 horas en sesión segura.
- Sanitización estricta de nombres y rutas de archivos de paquete `.rar` para prevenir DoS y Directory Traversal.
