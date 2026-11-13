# WT3 — Instalar, traducir y auditoría (`feat/catalog-install-translate`)

## Reglas comunes (obligatorias)
- Lee primero `memories.md` (secciones 11 y la regla de commits/PR) y `src/types/catalog.ts`.
- Trabaja SOLO en los archivos propios listados abajo. No edites `src/App.tsx`, `src/types/catalog.ts` ni `src/types/workspace.ts`; si necesitas un cambio ahí, anótalo en el PR y no lo hagas tú.
- Commits en Conventional Commits: `<tipo>(<ámbito>): <descripción en imperativo>`; PR con las 5 secciones de `.github/pull_request_template.md`.
- Identidad visual: carbón `#0a0d14`/`#121722`, único acento cian `#0ea5e9`, sin violeta; Geist / Geist Mono; probar a 1440, 1024, 768 y 390 px.
- Todo contenido de skills externas es NO confiable: sanitizar el Markdown, nunca ejecutar nada.
- Antes de abrir PR: `npx tsc -b`, `npm run build` y `npm test` en verde.

## Archivos propios
`src/components/catalog/InstallPanel.tsx`, `TranslateButton.tsx`, `AuditBadge.tsx`, `src/services/installCommandService.ts`, `src/services/translationService.ts`.

## Tareas
1. `installCommandService`: devuelve `InstallInstruction[]` para `claude-code`, `cursor` y `gemini-cli` con comando y ruta destino (p. ej. `~/.claude/skills/<nombre>`), correctos para Windows y Unix. Probar con pruebas unitarias o un script.
2. `InstallPanel`: pestañas por herramienta, comando visible y botón copiar (`navigator.clipboard`), ruta destino. Debe mostrar la advertencia del auditor antes del botón.
3. `AuditBadge`: reutiliza `auditWorkspacePackage` de `rarParserService.ts` y suma detección de scripts y patrones peligrosos (`.sh`, `.ps1`, `curl | sh`, `Invoke-Expression`, `rm -rf`, descargas remotas). Devuelve `SkillAuditFinding[]` con severidad.
4. `TranslateButton`: botón junto a Instalar que SOLO traduce el contenido al español (sin resumir ni explicar), conservando bloques de código, enlaces y frontmatter. Usar la API de traducción nativa del navegador si existe; si no, el flujo Gemini actual con clave del usuario. Eliminar el diccionario regex de respaldo y el `setTimeout` artificial de `MarkdownViewerTranslator` solo si el WT2/WT3 lo acuerdan (ese componente no es tuyo: déjalo y notifícalo en el PR).
5. Los componentes no importan nada de los archivos del WT1 ni del WT2; reciben datos por props.

## Hecho cuando
- El comando copiado funciona al pegarlo en cada herramienta.
- Una skill con `curl | sh` muestra advertencia de severidad alta.
- La traducción deja intactos los bloques de código.
