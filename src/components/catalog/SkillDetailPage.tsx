/**
 * Marcador de posición de la fase 0.
 * El WT2 (`feat/catalog-detail-ui`) reemplaza el cuerpo de este componente
 * manteniendo su firma de props, para que App.tsx no vuelva a cambiar.
 */
export interface SkillDetailPageProps {
  /** `CatalogSkill.id` seleccionado, o null si no hay ninguno. */
  skillId: string | null;
  onBack: () => void;
}

export function SkillDetailPage({ skillId, onBack }: SkillDetailPageProps) {
  return (
    <section className="mx-auto max-w-5xl p-6 text-slate-300">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-sky-400 hover:underline"
      >
        ← Skills
      </button>
      <p className="text-sm">
        Detalle de skill en construcción
        {skillId ? `: ${skillId}` : ''}.
      </p>
    </section>
  );
}
