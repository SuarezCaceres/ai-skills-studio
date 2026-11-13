import { useCatalog } from '../../hooks/useCatalog';
import { AuditBadge } from './AuditBadge';
import { InstallPanel } from './InstallPanel';
import { SkillDetailPage } from './SkillDetailPage';

interface CatalogDetailRouteProps {
  /** `CatalogSkill.id` seleccionado, o null si no hay ninguno. */
  skillId: string | null;
  onBack: () => void;
  /** Abre la pantalla de acceso (el inicio de sesión con GitHub vive allí). */
  onRequestLogin: () => void;
}

/**
 * Ruta de detalle del catálogo: conecta la interfaz (`SkillDetailPage`) con el
 * servicio real de GitHub (`useCatalog`) y con los paneles de auditoría e
 * instalación. La traducción se integra dentro de `SkillDetailPage`.
 */
export function CatalogDetailRoute({ skillId, onBack, onRequestLogin }: CatalogDetailRouteProps) {
  const { api, session } = useCatalog();
  return (
    <SkillDetailPage
      skillId={skillId}
      onBack={onBack}
      api={api}
      session={session}
      onRequestLogin={onRequestLogin}
      renderAudit={(skill) => <AuditBadge skill={skill} />}
      renderInstall={(skill) => <InstallPanel skill={skill} />}
    />
  );
}

export default CatalogDetailRoute;
