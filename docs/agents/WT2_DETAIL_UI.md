# WT2 — Interfaz de detalle de skill (`feat/catalog-detail-ui`)

## Reglas comunes (obligatorias)
- Lee primero `memories.md` (secciones 11 y la regla de commits/PR) y `src/types/catalog.ts`.
- Trabaja SOLO en los archivos propios listados abajo. No edites `src/App.tsx`, `src/types/catalog.ts` ni `src/types/workspace.ts`; si necesitas un cambio ahí, anótalo en el PR y no lo hagas tú.
- Commits en Conventional Commits: `<tipo>(<ámbito>): <descripción en imperativo>`; PR con las 5 secciones de `.github/pull_request_template.md`.
- Identidad visual: carbón `#0a0d14`/`#121722`, único acento cian `#0ea5e9`, sin violeta; Geist / Geist Mono; probar a 1440, 1024, 768 y 390 px.
- Todo contenido de skills externas es NO confiable: sanitizar el Markdown, nunca ejecutar nada.
- Antes de abrir PR: `npx tsc -b`, `npm run build` y `npm test` en verde.

## Archivos propios
`src/components/catalog/SkillDetailPage.tsx` (mantener la firma de props `{ skillId, onBack }`), `SkillSidebar.tsx`, `ResultsByModel.tsx`, `ReportResultForm.tsx`, `MoreFromAuthor.tsx`, `PublishSkillDialog.tsx`.

## Tareas
1. Layout de dos columnas inspirado en la referencia (Deska): izquierda con cabecera (nombre, autor, descripción) y pestañas **Resumen** / **Archivos**; derecha con ficha lateral.
2. `SkillSidebar`: botón **Votar** con contador, repositorio, licencia, categoría, "trae scripts" y espacio para el `AuditBadge` y el `InstallPanel` del WT3 (recibirlos como `children` o slots para no importar archivos ajenos).
3. `ResultsByModel`: tarjetas por modelo (`SpecificModelVersion`) con veredicto funcionó/parcial/no funcionó, comentario y enlace de evidencia; reutilizar estilos de `AIModelBenchmarkPanel`.
4. `ReportResultForm`: formulario con modelo, veredicto, comentario y evidencia; exige sesión de GitHub.
5. `MoreFromAuthor` con `listSkillsByAuthor`, y `PublishSkillDialog` para pegar la URL del repo.
6. Consumir `CatalogApi` solo por tipos. Mientras el WT1 no esté fusionado, usar un mock local dentro de tu carpeta (`src/components/catalog/mockCatalogApi.ts`).
7. Render del Markdown ya sanitizado; estados de carga, vacío y error; accesible por teclado (WAI-ARIA en pestañas).

## Hecho cuando
- La vista se ve y funciona a 1440, 1024, 768 y 390 px con datos mock.
- Sin violeta, sin degradados estridentes, sin desbordes.
