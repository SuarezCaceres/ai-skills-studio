/** Fecha relativa en español: "hoy", "ayer", "hace 5 días", "hace 2 meses". `—` si no es válida. */
export function relativeDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}

/** Fecha corta: "12 nov 2026". Cadena vacía si no es válida. */
export function shortDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
