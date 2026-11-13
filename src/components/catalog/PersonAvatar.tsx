import { safeHttpUrl } from './ResultsByModel';

interface PersonAvatarProps {
  login: string;
  avatarUrl?: string;
  /** Lado en píxeles. */
  size?: number;
  className?: string;
}

/** Avatar de una cuenta de GitHub; si no hay imagen válida muestra la inicial. */
export function PersonAvatar({ login, avatarUrl, size = 28, className = '' }: PersonAvatarProps) {
  const src = safeHttpUrl(avatarUrl);
  const box = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        style={box}
        className={`shrink-0 rounded-full border border-slate-700 bg-[#0a0d14] ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.42)) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#0a0d14] font-bold uppercase text-slate-300 ${className}`}
    >
      {login.slice(0, 1)}
    </span>
  );
}

export default PersonAvatar;
