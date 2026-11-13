import type { CatalogSkill } from '../types/catalog';

export interface MemberStats {
  /** Skills registradas por la persona. */
  skills: number;
  /** Categorías distintas de esas skills, de más a menos frecuentes. */
  categories: Array<{ name: string; count: number }>;
  /** Cuántas incluyen scripts. */
  withScripts: number;
  /** Repos de origen distintos. */
  repos: string[];
  /** Fecha ISO de la subida más reciente. */
  lastUploadAt?: string;
}

/** Resumen de lo que ha subido una persona (por quien registró la skill, no por el dueño del repo). */
export function computeMemberStats(skills: CatalogSkill[], login: string): MemberStats {
  const key = login.toLowerCase();
  const mine = skills.filter((s) => s.uploadedBy.login.toLowerCase() === key);

  const byCategory = new Map<string, number>();
  for (const s of mine) byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + 1);

  const latest = mine
    .map((s) => Date.parse(s.registeredAt))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];

  return {
    skills: mine.length,
    categories: [...byCategory.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    withScripts: mine.filter((s) => s.hasScripts).length,
    repos: [...new Set(mine.map((s) => s.repo))].sort(),
    lastUploadAt: latest === undefined ? undefined : new Date(latest).toISOString(),
  };
}
