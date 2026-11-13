import { useCatalog } from '../../hooks/useCatalog';
import { AuditBadge } from './AuditBadge';
import { InstallPanel } from './InstallPanel';
import { SkillDetailPage } from './SkillDetailPage';

interface CatalogDetailRouteProps {
  /** `CatalogSkill.id` seleccionado, o null si no hay ninguno. */
  skillId: string | null;
  onBack: () => void;
  /** Texto del botón de volver (por defecto "Catálogo"). */
  backLabel?: string;
  /** Abre la pantalla de acceso (el inicio de sesión con GitHub vive allí). */
  onRequestLogin: () => void;
}

/**
 * Ruta de detalle del catálogo: conecta la interfaz (`SkillDetailPage`) con el
 * servicio real de GitHub (`useCatalog`) y con los paneles de auditoría e
 * instalación. La traducción se integra dentro de `SkillDetailPage`.
 */
export function CatalogDetailRoute({ skillId, onBack, backLabel, onRequestLogin }: CatalogDetailRouteProps) {
  const { api, session } = useCatalog();
  return (
    <SkillDetailPage
      skillId={skillId}
      onBack={onBack}
      backLabel={backLabel}
      api={api}
      session={session}
      onRequestLogin={onRequestLogin}
      renderAudit={(skill) => <AuditBadge skill={skill} compact />}
      renderInstall={(skill) => <InstallPanel skill={skill} />}
    />
  );
}

export default CatalogDetailRoute;
