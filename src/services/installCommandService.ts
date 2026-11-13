import type { CatalogSkill, InstallInstruction, InstallTarget } from '../types/catalog';

/**
 * Genera los comandos de instalación de una skill del catálogo.
 *
 * Los datos de la skill vienen de un repositorio externo y NO son confiables:
 * todo lo que se interpola en un comando (repo, ruta, nombre, SHA) se valida
 * con listas blancas estrictas antes de construir el texto. Si algo no cumple,
 * se lanza `InstallCommandError` y no se genera ningún comando.
 *
 * El servicio no ejecuta nada: solo produce texto para que la persona lo copie.
 */

export type InstallPlatform = 'windows' | 'unix';

export type InstallSkillInput = Pick<
  CatalogSkill,
  'name' | 'repo' | 'skillPath' | 'commitSha'
>;

export class InstallCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstallCommandError';
  }
}

interface TargetSpec {
  label: string;
  /** Carpeta de skills de usuario relativa al directorio personal. */
  homeSegments: string[];
}

const TARGETS: Record<InstallTarget, TargetSpec> = {
  'claude-code': { label: 'Claude Code', homeSegments: ['.claude', 'skills'] },
  cursor: { label: 'Cursor', homeSegments: ['.cursor', 'skills'] },
  'gemini-cli': { label: 'Gemini CLI', homeSegments: ['.gemini', 'skills'] },
};

export const INSTALL_TARGETS: InstallTarget[] = ['claude-code', 'cursor', 'gemini-cli'];

const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})\/[A-Za-z0-9_.-]{1,100}$/;
const PATH_SEGMENT_RE = /^[A-Za-z0-9_.@+-]{1,100}$/;
const SHA_RE = /^[0-9a-f]{7,40}$/i;

/** Convierte el nombre de la skill en un nombre de carpeta seguro. */
export function toSafeFolderName(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    throw new InstallCommandError('El nombre de la skill no produce un nombre de carpeta válido.');
  }
  return cleaned;
}

function validateRepo(repo: string): string {
  if (!REPO_RE.test(repo) || repo.split('/').some((p) => p === '.' || p === '..')) {
    throw new InstallCommandError(`Repositorio no válido: "${repo}".`);
  }
  return repo;
}

function validateSkillPath(skillPath: string): string[] {
  const trimmed = skillPath.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return [];
  const segments = trimmed.split('/');
  for (const seg of segments) {
    if (seg === '.' || seg === '..' || !PATH_SEGMENT_RE.test(seg)) {
      throw new InstallCommandError(`Ruta de skill no válida: "${skillPath}".`);
    }
  }
  return segments;
}

function validateSha(sha: string): string {
  if (!SHA_RE.test(sha)) {
    throw new InstallCommandError('El SHA del commit no es válido.');
  }
  return sha;
}

/** Plataforma por defecto según el navegador (Windows → PowerShell, resto → shell POSIX). */
export function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'unix';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const hint = `${nav.userAgentData?.platform ?? ''} ${nav.platform ?? ''} ${nav.userAgent ?? ''}`;
  return /win/i.test(hint) && !/darwin/i.test(hint) ? 'windows' : 'unix';
}

/** Escapa una cadena ya validada para comillas simples de POSIX. */
function shSingle(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Escapa una cadena ya validada para comillas simples de PowerShell. */
function psSingle(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildUnixCommand(
  repo: string,
  sha: string,
  srcSegments: string[],
  homeSegments: string[],
  folder: string
): string {
  const url = `https://github.com/${repo}.git`;
  const dest = `"$HOME"/${homeSegments.join('/')}/${folder}`;
  const src = srcSegments.length ? `"$tmp"/${srcSegments.map(shSingle).join('/')}/.` : `"$tmp"/.`;
  return [
    'tmp="$(mktemp -d)"',
    `git -C "$tmp" init -q`,
    `git -C "$tmp" fetch -q --depth 1 ${shSingle(url)} ${shSingle(sha)}`,
    `git -C "$tmp" checkout -q FETCH_HEAD`,
    `rm -rf "$tmp"/.git`,
    `mkdir -p ${dest}`,
    `cp -R ${src} ${dest}/`,
    `rm -rf "$tmp"`,
  ].join(' && ');
}

function buildWindowsCommand(
  repo: string,
  sha: string,
  srcSegments: string[],
  homeSegments: string[],
  folder: string
): string {
  const url = `https://github.com/${repo}.git`;
  const srcRel = srcSegments.join('\\');
  const destRel = [...homeSegments, folder].join('\\');
  const copySource = srcRel ? `(Join-Path $tmp ${psSingle(srcRel)})` : '$tmp';
  return [
    `$ErrorActionPreference = 'Stop'`,
    `$tmp = Join-Path $env:TEMP ('skill-' + [guid]::NewGuid().ToString('N'))`,
    `New-Item -ItemType Directory -Path $tmp | Out-Null`,
    `git -C $tmp init -q`,
    `git -C $tmp fetch -q --depth 1 ${psSingle(url)} ${psSingle(sha)}`,
    `if ($LASTEXITCODE -ne 0) { throw 'git fetch falló' }`,
    `git -C $tmp checkout -q FETCH_HEAD`,
    `if ($LASTEXITCODE -ne 0) { throw 'git checkout falló' }`,
    `Remove-Item -Recurse -Force (Join-Path $tmp '.git')`,
    `$dest = Join-Path $HOME ${psSingle(destRel)}`,
    `New-Item -ItemType Directory -Force -Path $dest | Out-Null`,
    `Copy-Item -Recurse -Force -Path (Join-Path ${copySource} '*') -Destination $dest`,
    `Remove-Item -Recurse -Force $tmp`,
  ].join('; ');
}

function displayDestination(
  platform: InstallPlatform,
  homeSegments: string[],
  folder: string
): string {
  return platform === 'windows'
    ? `%USERPROFILE%\\${[...homeSegments, folder].join('\\')}`
    : `~/${[...homeSegments, folder].join('/')}`;
}

/**
 * Devuelve una instrucción por herramienta (`claude-code`, `cursor`, `gemini-cli`).
 * El comando descarga el commit exacto auditado (`commitSha`) con `git`, copia la
 * carpeta de la skill a la ruta destino y borra el directorio temporal.
 *
 * @throws InstallCommandError si algún dato de la skill no es seguro de interpolar.
 */
export function getInstallInstructions(
  skill: InstallSkillInput,
  platform: InstallPlatform = detectInstallPlatform()
): InstallInstruction[] {
  const repo = validateRepo(skill.repo);
  const sha = validateSha(skill.commitSha);
  const srcSegments = validateSkillPath(skill.skillPath);
  const folder = toSafeFolderName(skill.name);

  return INSTALL_TARGETS.map((target) => {
    const spec = TARGETS[target];
    const command =
      platform === 'windows'
        ? buildWindowsCommand(repo, sha, srcSegments, spec.homeSegments, folder)
        : buildUnixCommand(repo, sha, srcSegments, spec.homeSegments, folder);
    return {
      target,
      label: spec.label,
      destinationPath: displayDestination(platform, spec.homeSegments, folder),
      command,
    };
  });
}
