import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../hooks/useCatalog';
import { isTeamLogin } from '../../config/team';
import type { Lesson } from '../../types/lessons';
import {
  LESSONS_KEY,
  createLocalLessonsStore,
  exportLessons,
  importLessons,
  replaceAllLessons,
  type ImportResult,
} from '../../services/lessonsStore';
import { loadWorkingCopies } from '../../utils/workingCopy';

/** Instancia única del almacén; cambiar el almacenamiento solo exige cambiar esta línea. */
const store = createLocalLessonsStore();

export interface UseLessonsResult {
  lessons: Lesson[];
  /** `true` si el navegador no dejó leer o guardar (los cambios no sobrevivirán a una recarga). */
  storageFailed: boolean;
  save: (lesson: Lesson) => boolean;
  remove: (id: string) => boolean;
  exportJson: () => string;
  importJson: (text: string) => ImportResult & { saved: boolean };
}

/** Clases guardadas en el navegador, sincronizadas entre pestañas. */
export function useLessons(): UseLessonsResult {
  const [lessons, setLessons] = useState<Lesson[]>(() => store.list());
  const [storageFailed, setStorageFailed] = useState(() => store.failed);

  const refresh = useCallback(() => {
    setLessons(store.list());
    setStorageFailed(store.failed);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === LESSONS_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const save = useCallback(
    (lesson: Lesson) => {
      const ok = store.save(lesson);
      refresh();
      return ok;
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      const ok = store.remove(id);
      refresh();
      return ok;
    },
    [refresh]
  );

  const exportJson = useCallback(() => exportLessons(store.list()), []);

  const importJson = useCallback(
    (text: string) => {
      const result = importLessons(text, store.list());
      const saved = replaceAllLessons(store, result.lessons);
      refresh();
      return { ...result, saved };
    },
    [refresh]
  );

  return { lessons, storageFailed, save, remove, exportJson, importJson };
}

/** Skill que se puede vincular a una clase. */
export interface SkillOption {
  /** `CatalogSkill.id`. */
  id: string;
  name: string;
  authorLogin?: string;
  avatarUrl?: string;
  /** De dónde sale la opción. */
  source: 'equipo' | 'copia';
  /** `true` si además hay una copia de trabajo abierta en el estudio. */
  hasCopy: boolean;
}

export interface UseSkillOptionsResult {
  options: SkillOption[];
  status: 'loading' | 'ready' | 'error';
  /** Busca una skill por id; si no está, devuelve `undefined`. */
  find: (id: string) => SkillOption | undefined;
}

/** Skills del equipo más las copias de trabajo abiertas en el estudio (sin duplicados). */
export function useSkillOptions(): UseSkillOptionsResult {
  const { api } = useCatalog();
  const [team, setTeam] = useState<SkillOption[]>([]);
  const [status, setStatus] = useState<UseSkillOptionsResult['status']>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .listSkills()
      .then((all) => {
        if (cancelled) return;
        setTeam(
          all
            .filter((s) => isTeamLogin(s.uploadedBy.login))
            .map((s) => ({
              id: s.id,
              name: s.name,
              authorLogin: s.uploadedBy.login,
              avatarUrl: s.uploadedBy.avatarUrl,
              source: 'equipo' as const,
              hasCopy: false,
            }))
        );
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [api]);

  const options = useMemo(() => {
    const copyIds = new Map<string, string>();
    for (const doc of loadWorkingCopies()) {
      if (doc.id.startsWith('team:')) copyIds.set(doc.id.slice('team:'.length), doc.name);
    }
    const merged = team.map((o) => ({ ...o, hasCopy: copyIds.has(o.id) }));
    for (const [id, name] of copyIds) {
      if (!merged.some((o) => o.id === id)) merged.push({ id, name, source: 'copia', hasCopy: true });
    }
    return merged;
  }, [team]);

  const find = useCallback((id: string) => options.find((o) => o.id === id), [options]);
  return { options, status, find };
}
