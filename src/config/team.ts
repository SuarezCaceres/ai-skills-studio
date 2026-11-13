/**
 * Cuentas de GitHub que forman el equipo. La vista "Skills del equipo" muestra las skills
 * cuyo Issue ancla en el catálogo fue abierto por alguna de estas cuentas.
 *
 * Para añadir a una persona basta con agregar su login (sin @). Es información pública:
 * no pongas aquí nada que no quieras que cualquiera lea en el repo.
 */
export const TEAM_LOGINS: readonly string[] = ['SuarezCaceres'];

const TEAM_SET = new Set(TEAM_LOGINS.map((l) => l.toLowerCase()));

/** `true` si el login (sin distinguir mayúsculas) pertenece al equipo. */
export function isTeamLogin(login: string): boolean {
  return TEAM_SET.has(login.toLowerCase());
}
