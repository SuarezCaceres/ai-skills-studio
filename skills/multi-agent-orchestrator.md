---
id: skill-multi-agent-ads
title: "Autonomous Multi-Agent Orchestrator"
category: "Multi-Agent & MCP"
level: "Avanzado"
kind: "proyecto"
model: "Claude / Opus (Ultra)"
tags:
  - "#skill"
  - "#skill/multi-agent"
  - "#google-antigravity-sdk"
  - "#claude-opus"
  - "#mcp"
  - "#subagents"
updated: "2026-11-05"
---

# Autonomous Multi-Agent Orchestrator · 161 Checks & 3 Parallel Agents

> [!NOTE] Arquitectura
> Arquitectura open-source empaquetada en `.rar` que coordina 3 subagentes paralelos, servidores MCP y barras de comando interactivas con traducción al español en 1 clic.

## Conexiones y Módulos Relacionados
- [[Códice Neuronal - MOC|Mapa de Contenidos Principal (MOC)]]
- [[skills/auditor-de-conversiones|Auditor de Conversiones & Sistema UI]]
- [[skills/sistema-memoria-agentes|Sistema de Memoria Persistente & Hooks]]
- [[REPORTE_SEGURIDAD_Y_CALIDAD|Auditoría de Seguridad y Calidad]]

---

## 1. Especificación del Agente (`SKILL.md`)

```markdown
---
name: agent-mcp-orchestrator
description: Coordinate specialized subagents, MCP tools, and step-by-step validations with full traceability.
---

# Autonomous Agents & MCP Workflows Orchestrator

## Skill Purpose
Coordinate specialized subagents, MCP tools, and step-by-step validations with full traceability.

## AI Agent Instructions
1. Always use native semantic elements (<button type="button">, <figure>, <pre tabindex="0">).
2. Synchronize the aria-expanded state on every dropdown menu trigger.
3. Include clear keyboard shortcuts and support closing via the Escape key.

## Visual UI Plugins Specification
- Build floating toolbar to invoke subagents and export reports.
```

---

## 2. Capacidades Multi-Agente
- Invocación de 3 subagentes en paralelo con tiempo de auditoría < 45 segundos.
- Sincronización continua de herramientas MCP (`gemini-api`, `google-antigravity-sdk`).
- Trazabilidad y captura de snapshots visuales y telemetría de rendimiento.
