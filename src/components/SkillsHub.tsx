import React, { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { HardDrive, Users } from 'lucide-react';
import { TeamSkillsPage } from './catalog/TeamSkillsPage';

type HubTab = 'equipo' | 'locales';

const TABS: Array<{ id: HubTab; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'equipo', label: 'Equipo', Icon: Users },
  { id: 'locales', label: 'Locales', Icon: HardDrive },
];

interface SkillsHubProps {
  /** Abre el detalle de una skill del catálogo. */
  onOpenCatalogSkill: (id: string) => void;
  /** Abre la pantalla de acceso (inicio de sesión con GitHub). */
  onRequestLogin: () => void;
  /** Vista actual de skills guardadas en este navegador. */
  renderLocal: () => React.ReactNode;
}

/**
 * Página "Skills": por defecto la interfaz del equipo (autor y GitHub de cada skill) y,
 * en una pestaña aparte, las skills locales de este navegador.
 */
export const SkillsHub: React.FC<SkillsHubProps> = ({ onOpenCatalogSkill, onRequestLogin, renderLocal }) => {
  const [tab, setTab] = useState<HubTab>('equipo');
  const refs = useRef<Record<HubTab, HTMLButtonElement | null>>({ equipo: null, locales: null });

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    refs.current[TABS[next].id]?.focus();
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6">
        <div role="tablist" aria-label="Origen de las skills" className="flex gap-1 border-b border-slate-800">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                ref={(el) => {
                  refs.current[id] = el;
                }}
                type="button"
                role="tab"
                id={`skills-tab-${id}`}
                aria-selected={active}
                aria-controls={`skills-panel-${id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={onKeyDown}
                className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0ea5e9] ${
                  active ? 'border-b-[#0ea5e9] text-white' : 'border-b-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`skills-panel-${tab}`} aria-labelledby={`skills-tab-${tab}`}>
        {tab === 'equipo' ? (
          <TeamSkillsPage onOpenSkill={onOpenCatalogSkill} onRequestLogin={onRequestLogin} />
        ) : (
          <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6">{renderLocal()}</div>
        )}
      </div>
    </div>
  );
};

export default SkillsHub;
