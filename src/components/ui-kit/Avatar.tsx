import { useState } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
type AvatarStatus = 'online' | 'away' | 'offline';

const SIZES: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  sm: { box: 'h-8 w-8', text: 'text-[11px]', dot: 'h-2 w-2' },
  md: { box: 'h-10 w-10', text: 'text-sm', dot: 'h-2.5 w-2.5' },
  lg: { box: 'h-14 w-14', text: 'text-lg', dot: 'h-3 w-3' },
  xl: { box: 'h-20 w-20', text: 'text-2xl', dot: 'h-3.5 w-3.5' },
};

const STATUS: Record<AvatarStatus, { color: string; label: string }> = {
  online: { color: 'bg-emerald-400', label: 'en línea' },
  away: { color: 'bg-amber-400', label: 'ausente' },
  offline: { color: 'bg-slate-500', label: 'desconectado' },
};

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Avatar con imagen; si falta o no carga, muestra las iniciales. El estado se anuncia como texto. */
export function Avatar({ name, src, size = 'md', status }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];
  return (
    <span className={`relative inline-flex shrink-0 ${s.box}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="h-full w-full rounded-full border border-slate-700 bg-[#0a0d14] object-cover"
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={`inline-flex h-full w-full items-center justify-center rounded-full border border-slate-700 bg-[#171d2b] font-semibold text-sky-200 ${s.text}`}
        >
          <span aria-hidden="true">{initials(name)}</span>
        </span>
      )}
      {status && (
        <>
          <span
            aria-hidden="true"
            className={`absolute bottom-0 right-0 rounded-full border-2 border-[#121722] ${STATUS[status].color} ${s.dot}`}
          />
          <span className="sr-only">{STATUS[status].label}</span>
        </>
      )}
    </span>
  );
}

interface AvatarGroupProps {
  people: Array<{ name: string; src?: string }>;
  /** Cuántos se dibujan antes de resumir el resto en «+N». */
  max?: number;
  size?: AvatarSize;
}

/** Pila de avatares que resume el sobrante en un contador. */
export function AvatarGroup({ people, max = 4, size = 'md' }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div role="group" aria-label={`${people.length} personas`} className="flex items-center -space-x-2">
      {shown.map((person) => (
        <span key={person.name} className="rounded-full ring-2 ring-[#121722]">
          <Avatar name={person.name} src={person.src} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full border border-slate-700 bg-[#0a0d14] text-xs font-semibold text-slate-300 ring-2 ring-[#121722] ${SIZES[size].box}`}
        >
          +{rest}
          <span className="sr-only"> más</span>
        </span>
      )}
    </div>
  );
}

/** Retrato dibujado en SVG para no depender de imágenes externas. */
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='#0e2a3d'/><circle cx='40' cy='32' r='14' fill='#38bdf8'/><path d='M12 80c2-18 14-26 28-26s26 8 28 26z' fill='#0ea5e9'/></svg>"
  );

const TEAM = [
  { name: 'Mateo Suárez' },
  { name: 'Lucía Fernández', src: PORTRAIT },
  { name: 'Diego Ramos' },
  { name: 'Ana Gómez' },
  { name: 'Pablo Ruiz' },
  { name: 'Sara León' },
];

/** Demo del registro: tamaños, estados, imagen con respaldo y grupo. */
export function Demo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <Avatar name="Mateo Suárez" size="sm" />
        <Avatar name="Lucía Fernández" src={PORTRAIT} size="md" status="online" />
        <Avatar name="Diego Ramos" size="lg" status="away" />
        <Avatar name="Ana Gómez" size="xl" status="offline" />
        <Avatar name="Imagen rota" src="data:image/png;base64,AAAA" size="lg" />
      </div>
      <AvatarGroup people={TEAM} max={4} />
    </div>
  );
}
