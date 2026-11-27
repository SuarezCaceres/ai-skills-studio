import type { CatalogDetailRouteProps } from '../../types/catalog';
import { useCatalog } from '../../hooks/useCatalog';
import { AuditBadge } from './AuditBadge';
import { InstallPanel } from './InstallPanel';
import { SkillDetailPage } from './SkillDetailPage';

/**
 * Ruta de detalle del catálogo: conecta la interfaz (`SkillDetailPage`) con el
 * servicio real de GitHub (`useCatalog`) y con los paneles de auditoría e
 * instalación. Soporta tanto skills del catálogo como vistas previas fijadas a
 * `commitSha` desde Explorar (`skills.sh`).
 */
export function CatalogDetailRoute({
  skillId,
  previewSkill,
  onBack,
  backLabel,
  onImportPreview,
  importingPreview,
  onRequestLogin,
}: CatalogDetailRouteProps) {
  const { api, session } = useCatalog();
  return (
    <SkillDetailPage
      skillId={skillId}
      previewSkill={previewSkill}
      onBack={onBack}
      backLabel={backLabel}
      onImportPreview={onImportPreview}
      importingPreview={importingPreview}
      api={api}
      session={session}
      onRequestLogin={onRequestLogin}
      renderAudit={(skill) => <AuditBadge skill={skill} compact />}
      renderInstall={(skill) => <InstallPanel skill={skill} />}
    />
  );
}

export default CatalogDetailRoute;
