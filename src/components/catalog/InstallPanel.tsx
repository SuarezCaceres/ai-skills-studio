import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Copy, FolderOutput } from 'lucide-react';
import type { CatalogSkill, InstallTarget } from '../../types/catalog';
import {
  InstallCommandError,
  detectInstallPlatform,
  getInstallInstructions,
  type InstallPlatform,
} from '../../services/installCommandService';
import { AuditBadge, auditCatalogSkill, highestSeverity } from './AuditBadge';

interface InstallPanelProps {
  skill: CatalogSkill;
  className?: string;
}

const PLATFORMS: Array<{ id: InstallPlatform; label: string }> = [
  { id: 'windows', label: 'Windows (PowerShell)' },
  { id: 'unix', label: 'macOS / Linux' },
];

export const InstallPanel: React.FC<InstallPanelProps> = ({ skill, className }) => {
  const baseId = useId();
  const [platform, setPlatform] = useState<InstallPlatform>(() => detectInstallPlatform());
  const [target, setTarget] = useState<InstallTarget>('claude-code');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const findings = useMemo(() => auditCatalogSkill(skill), [skill]);
  const level = highestSeverity(findings);

  const { instructions, error } = useMemo(() => {
    try {
      return { instructions: getInstallInstructions(skill, platform), error: null };
    } catch (e) {
      return {
        instructions: [],
        error: e instanceof InstallCommandError ? e.message : 'No se pudo generar el comando.',
      };
    }
  }, [skill, platform]);

  // Una skill distinta exige una nueva confirmación.
  useEffect(() => {
    setAcknowledged(false);
    setCopied(false);
  }, [skill.id, skill.commitSha]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const active = instructions.find((i) => i.target === target) ?? instructions[0];
  const blocked = level === 'danger' && !acknowledged;

  const copy = async () => {
    if (!active || blocked) return;
    try {
      await navigator.clipboard.writeText(active.command);
      setCopied(true);
      setCopyFailed(false);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    if (instructions.length === 0) return;
    const idx = instructions.findIndex((i) => i.target === target);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % instructions.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + instructions.length) % instructions.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = instructions.length - 1;
    else return;
    e.preventDefault();
    setTarget(instructions[next].target);
    document.getElementById(`${baseId}-tab-${instructions[next].target}`)?.focus();
  };

  return (
    <section
      aria-label="Instalar la skill"
      className={`rounded-xl border border-slate-800 bg-[#0a0d14] p-4 ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Herramienta de destino" className="flex gap-1" onKeyDown={onTabKey}>
          {instructions.map((i) => {
            const selected = i.target === target;
            return (
              <button
                key={i.target}
                id={`${baseId}-tab-${i.target}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTarget(i.target)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] ${
                  selected
                    ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9]'
                    : 'border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                {i.label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Sistema</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as InstallPlatform)}
            className="rounded-md border border-slate-700 bg-[#121722] px-2 py-1 text-xs text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* La advertencia del auditor va ANTES del botón de copiar. */}
      <AuditBadge findings={findings} className="mt-3" />

      {level === 'danger' && (
        <label className="mt-3 flex items-start gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#0ea5e9]"
          />
          <span>He revisado los hallazgos de riesgo alto y quiero copiar el comando de todos modos.</span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/30 p-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {active && (
        <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active.target}`} className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
            <FolderOutput className="h-3.5 w-3.5 text-[#0ea5e9]" aria-hidden="true" />
            <span>Destino</span>
            <code className="font-mono text-slate-200">{active.destinationPath}</code>
          </div>
          <pre
            tabIndex={0}
            className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-800 bg-[#121722] p-3 font-mono text-xs leading-relaxed text-slate-100"
          >
            {active.command}
          </pre>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copy}
              disabled={blocked}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-[#0a0d14] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copiado' : 'Copiar comando'}
            </button>
            <span className="text-xs text-slate-400" role="status" aria-live="polite">
              {copyFailed
                ? 'No se pudo copiar; selecciona el texto manualmente.'
                : `Instala el commit ${skill.commitSha.slice(0, 7)} que se auditó.`}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default InstallPanel;
