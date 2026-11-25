import React, { useEffect } from 'react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
import { ComputerLightBeamShowcase } from './ComputerLightBeamShowcase';

interface InformativeLandingSectionProps {
  onNavigatePage: (page: AppPageRoute) => void;
  onSelectModelVersion?: (version: SpecificModelVersion) => void;
  onFilterByFramework?: (tag: string) => void;
}

const HUB_DIAGRAM_JSON = JSON.stringify({
  layout: 'hub',
  ground: 'dots',
  alt: 'Códice Studio conecta directivas SKILL.md y repositorios de GitHub con Obsidian, Claude, Gemini y Cursor.',
  center: {
    label: 'Códice Studio',
    icon: 'ui:layers',
  },
  spokes: [
    { label: 'SKILL.md', icon: 'skill' },
    { label: 'GitHub', icon: 'github' },
    { label: 'Obsidian', icon: 'obsidian' },
    { label: 'Claude', icon: 'claude' },
    { label: 'Gemini', icon: 'gemini' },
    { label: 'Cursor', icon: 'cursor' },
  ],
});

declare global {
  interface Window {
    __tasteUi?: {
      startAll: (doc: Document) => void;
    };
    TPDiagram?: {
      mount: (el: HTMLElement, spec: any, opts?: any) => any;
      auto: (root?: Document | HTMLElement, opts?: any) => Promise<any[]>;
      presets: (custom?: string) => Promise<any>;
      ready: () => Promise<void>;
    };
  }
}

export const InformativeLandingSection: React.FC<InformativeLandingSectionProps> = ({
  onNavigatePage,
}) => {
  const diagramRef = React.useRef<HTMLDivElement | null>(null);
  const diagramInstanceRef = React.useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    if (window.__tasteUi) {
      try {
        window.__tasteUi.startAll(document);
      } catch {}
    }

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const setupDiagram = () => {
      if (!isMounted || !diagramRef.current) return;
      if (window.TPDiagram) {
        try {
          if (diagramInstanceRef.current?.destroy) {
            diagramInstanceRef.current.destroy();
          }
          const parsedSpec = JSON.parse(HUB_DIAGRAM_JSON);
          diagramInstanceRef.current = window.TPDiagram.mount(
            diagramRef.current,
            parsedSpec
          );
        } catch (e) {
          console.error('Error mounting TPDiagram:', e);
        }
      } else if (attempts < 20) {
        attempts++;
        timerId = setTimeout(setupDiagram, 60);
      }
    };

    setupDiagram();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (diagramInstanceRef.current?.destroy) {
        try {
          diagramInstanceRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  const openModule = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: AppPageRoute
  ) => {
    e.preventDefault();
    onNavigatePage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <>
      {/* 1. HERO CENTRADO (100svh · laptop interactiva con los 4 flujos vigentes) */}
      <section className="hero hero--centred" data-enter aria-labelledby="hero-h">
        <div className="wrap">
          <div className="hero-text">
            <div className="hero__c">
              <span className="pill" role="status">
                <span>Inspección GitHub</span>
                <span className="muted hidden sm:inline">Fijada a commitSha</span>
              </span>

              <h1 id="hero-h">Catálogo e inspector de skills para equipos IA</h1>

              <p className="hero__lead">
                Audita directivas SKILL.md y su código fuente fijados a commitSha en
                GitHub, descubre skills en skills.sh, prueba componentes UI accesibles y
                documenta clases en Códice.
              </p>

              <div className="btn-row">
                <a
                  className="btn btn--primary"
                  href="#inspector"
                  onClick={(e) => openModule(e, 'catalogo')}
                >
                  Explorar catálogo
                </a>
                <a className="btn btn--secondary" href="#capabilities">
                  Ver capacidades
                </a>
              </div>
            </div>

            <div
              className="hero__window"
              role="region"
              aria-label="Laptop 3D interactiva con vista previa de inspección por commitSha y módulos de Códice Studio"
            >
              <ComputerLightBeamShowcase onNavigatePage={onNavigatePage} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. APP-FRAME (Lista de archivos de la skill + Inspector bajo demanda fijado a commitSha) */}
      <section className="section" id="inspector" aria-labelledby="inspector-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5">
              <h2 id="inspector-h">Inspección bajo demanda fijada al commit exacto</h2>
            </div>
            <div className="span-6 start-7 stack-4">
              <p className="muted">
                Explora el catálogo del equipo o cualquier skill de GitHub en skills.sh,
                descarga sus scripts bajo demanda desde su commitSha y verifica hallazgos
                con AuditBadge antes de instalar.
              </p>
              <a
                className="link"
                href="#capabilities"
                onClick={(e) => openModule(e, 'boveda')}
              >
                Explorar skills del equipo
              </a>
            </div>
          </div>

          <div
            className="ui app fill"
            role="img"
            aria-label="Lista de archivos auditados junto al inspector bajo demanda fijado a commitSha en FilesPanel.tsx"
            data-ui-pause-host
          >
            <div className="app__pane app__pane--list">
              <div
                className="ui ui-panel ui-win"
                data-ui="window"
                data-open="Pendiente"
                data-work="Auditando"
                data-done="Verificado"
              >
                <div className="ui-win__bar">
                  <span className="ui-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="ui-win__crumb">
                    Catálogo <i>/</i> <b>Inspección commitSha</b>
                  </span>
                  <span className="ui-spacer" />
                  <span className="ui-win__search" aria-hidden="true">
                    <svg className="ui-icon" viewBox="0 0 16 16">
                      <circle cx="7" cy="7" r="4.5" />
                      <path d="m10.5 10.5 3 3" />
                    </svg>
                    <span className="ui-win__ph">Filtrar</span>
                    <span className="ui-kbd">/</span>
                  </span>
                </div>
                <div className="ui-win__body">
                  <nav className="ui-win__side" aria-hidden="true">
                    <span className="ui-win__nav is-on">
                      <svg className="ui-icon" viewBox="0 0 16 16">
                        <path d="M2.5 9h3l1 1.5h3l1-1.5h3" />
                        <path d="M2.5 9 4 3.5h8L13.5 9v3.5h-11z" />
                      </svg>
                      Activos<em>12</em>
                    </span>
                    <span className="ui-win__nav">
                      <svg className="ui-icon" viewBox="0 0 16 16">
                        <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                      </svg>
                      Auditados<em>10</em>
                    </span>
                    <span className="ui-win__label">Módulos</span>
                    <span className="ui-win__nav">
                      <span className="ui-win__hash">#</span>catalogo
                    </span>
                    <span className="ui-win__nav">
                      <span className="ui-win__hash">#</span>skills-sh
                    </span>
                  </nav>
                  <div className="ui-win__main">
                    <div className="ui-win__cols" aria-hidden="true">
                      <span>Autor</span>
                      <span>Archivo</span>
                      <span>Estado</span>
                      <span>Edad</span>
                    </div>
                    <ul className="ui-win__rows">
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="1">MS</span>
                        <span className="ui-win__who">Mateo Suárez</span>
                        <span className="ui-win__sub">FilesPanel.tsx · commitSha</span>
                        <span className="ui-win__st" data-st>Pendiente</span>
                        <span className="ui-win__age">2m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="3">CS</span>
                        <span className="ui-win__who">Códice Auditor</span>
                        <span className="ui-win__sub">design-taste-frontend/SKILL.md</span>
                        <span className="ui-win__st" data-st>Pendiente</span>
                        <span className="ui-win__age">5m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="4">VF</span>
                        <span className="ui-win__who">Valeria Fuentes</span>
                        <span className="ui-win__sub">AuditBadge.tsx · Re-auditoría</span>
                        <span className="ui-win__st" data-st>Pendiente</span>
                        <span className="ui-win__age">9m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="2">DR</span>
                        <span className="ui-win__who">Diego Rojas</span>
                        <span className="ui-win__sub">securityHardening.ts · 512 KB</span>
                        <span className="ui-win__st is-you" data-st>Revisión</span>
                        <span className="ui-win__age">14m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="5">LP</span>
                        <span className="ui-win__who">Lucía Paredes</span>
                        <span className="ui-win__sub">github-workflow/SKILL.md</span>
                        <span className="ui-win__st is-done" data-st>Verificado</span>
                        <span className="ui-win__age">21m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="3">MS</span>
                        <span className="ui-win__who">Mateo Suárez</span>
                        <span className="ui-win__sub">NavbarActiveSkill.tsx · A11y</span>
                        <span className="ui-win__st is-done" data-st>Verificado</span>
                        <span className="ui-win__age">29m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="1">CS</span>
                        <span className="ui-win__who">Códice Auditor</span>
                        <span className="ui-win__sub">SkillsShPage.tsx · skills.sh</span>
                        <span className="ui-win__st is-done" data-st>Verificado</span>
                        <span className="ui-win__age">34m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="4">VF</span>
                        <span className="ui-win__who">Valeria Fuentes</span>
                        <span className="ui-win__sub">ComponentsPage.tsx · Kit UI</span>
                        <span className="ui-win__st is-done" data-st>Verificado</span>
                        <span className="ui-win__age">41m</span>
                      </li>
                      <li className="ui-win__row" data-row>
                        <span className="ui-avatar" data-tone="2">DR</span>
                        <span className="ui-win__who">Diego Rojas</span>
                        <span className="ui-win__sub">LessonsSection.tsx · Códice</span>
                        <span className="ui-win__st is-done" data-st>Verificado</span>
                        <span className="ui-win__age">48m</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="app__pane app__pane--open" data-ui-loop>
              <div className="ui ui-panel ui-diff" data-ui="diff-review">
                <div className="ui-diff__head">
                  <svg
                    className="ui-icon ui-diff__fold"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="m4.5 6.25 3.5 3.5 3.5-3.5" />
                  </svg>
                  <span className="ui-diff__tool" aria-hidden="true">
                    <svg
                      viewBox="0 0 256 256"
                      width="16"
                      height="16"
                      aria-hidden="true"
                      className="shrink-0 rounded-[2px]"
                    >
                      <path d="M20 0h216a20 20 0 0 1 20 20v216a20 20 0 0 1-20 20H20a20 20 0 0 1-20-20V20A20 20 0 0 1 20 0Z" fill="#3178C6" />
                      <path d="M150.5 200.5v27.6c4.5 2.3 9.8 4 16 5.2 6.1 1.1 12.6 1.7 19.4 1.7 6.6 0 12.9-.6 18.9-1.9 6-1.2 11.2-3.3 15.7-6.2 4.5-2.9 8-6.7 10.6-11.4 2.7-4.7 4-10.5 4-17.4 0-5-.8-9.4-2.3-13.2-1.5-3.8-3.6-7.1-6.4-10-2.9-3-6.2-5.6-10.2-8-4-2.3-8.4-4.5-13.4-6.6-3.6-1.5-6.9-3-9.7-4.4-2.9-1.4-5.4-2.8-7.4-4.3-2-1.5-3.5-3-4.6-4.7-1.1-1.6-1.7-3.5-1.7-5.5 0-1.9.5-3.6 1.5-5.2 1-1.5 2.4-2.8 4.2-3.9 1.8-1.1 4-1.9 6.5-2.5 2.6-.6 5.5-.9 8.6-.9 2.3 0 4.8.2 7.3.5 2.6.4 5.2.9 7.8 1.6 2.6.7 5.1 1.6 7.5 2.7 2.5 1.1 4.7 2.4 6.8 3.8v-25.8c-4.2-1.6-8.8-2.8-13.8-3.6-5-.8-10.7-1.2-17.1-1.2-6.6 0-12.8.7-18.7 2.1-5.9 1.4-11 3.6-15.5 6.6-4.5 3-8 6.8-10.6 11.4-2.6 4.7-3.9 10.2-3.9 16.6 0 8.3 2.4 15.3 7.1 21.1 4.8 5.8 12 10.7 21.7 14.8 3.8 1.5 7.3 3.1 10.6 4.6 3.3 1.5 6.1 3 8.5 4.6 2.4 1.6 4.3 3.4 5.7 5.3 1.4 1.9 2.1 4 2.1 6.5 0 1.8-.5 3.4-1.3 4.9-.9 1.5-2.2 2.8-4 4-1.8 1.1-4 2-6.6 2.6-2.6.6-5.7 1-9.2 1-6 0-11.9-1.1-17.8-3.2-5.9-2.1-11.3-5.2-16.3-9.4ZM104.5 131.7H140V109H41v22.7h35.3V233h28.2v-101.3Z" fill="#FFF" />
                    </svg>
                  </span>
                  <span className="ui-diff__repo">codice-studio</span>
                  <i className="ui-diff__slash" aria-hidden="true">/</i>
                  <span className="ui-diff__path">
                    <span className="ui-diff__dir">src/components/catalog/</span>
                    <b>FilesPanel.tsx</b>
                  </span>
                  <span className="ui-spacer" />
                  <span className="ui-diff__stat">
                    <b className="is-add">
                      <span className="ui-diff__was">+5</span>
                      <span className="ui-diff__now">+6</span>
                    </b>
                    <b className="is-del">
                      <span className="ui-diff__was">&minus;2</span>
                      <span className="ui-diff__now">&minus;3</span>
                    </b>
                    <span className="ui-diff__bar" aria-hidden="true">
                      <i className="is-add" />
                      <i className="is-add" />
                      <i className="is-add" />
                      <i className="is-del" />
                      <i className="is-del" />
                    </span>
                  </span>
                </div>
                <div className="ui-diff__hunk">
                  <span>@@ -44,12 +44,14 @@</span>{' '}
                  <em className="ui-diff__sig truncate block">
                    inspectSkillFileAtSha(repo, path, commitSha) &#123;
                  </em>
                </div>
                <div className="ui-diff__lines">
                  <div className="ui-diff__ln">
                    <i>44</i>
                    <i>44</i>
                    <span className="ui-diff__code" data-i="1">
                      <span className="ui-diff__ind">  </span>
                      <span className="k">const</span> safePath ={' '}
                      <span className="f">assertSafeRelativePath</span>(path);
                    </span>
                  </div>
                  <div className="ui-diff__ln is-del">
                    <i>45</i>
                    <i />
                    <span className="ui-diff__code" data-i="1">
                      <span className="ui-diff__ind">  </span>
                      <span className="k">const</span> branch = <span className="s">&quot;main&quot;</span>;
                    </span>
                  </div>
                  <div className="ui-diff__ln is-add">
                    <i />
                    <i>45</i>
                    <span className="ui-diff__code" data-i="1">
                      <span className="ui-diff__ind">  </span>
                      <span className="k">const</span> content ={' '}
                      <mark className="ui-diff__w">
                        <span className="f">getGithubFileAtSha</span>(repo, safePath, commitSha)
                      </mark>
                      ;
                    </span>
                  </div>
                  <div className="ui-diff__ln is-target" data-diff-target>
                    <i>46</i>
                    <i>46</i>
                    <span className="ui-diff__code" data-i="2">
                      <span className="ui-diff__ind">    </span>
                      <span className="k">if</span> (sizeBytes &gt;{' '}
                      <mark className="ui-diff__w">
                        <span className="n">1048576</span>
                      </mark>
                      ) <span className="k">return</span> linkToGithub;
                    </span>
                  </div>
                  <div className="ui-diff__sug" data-diff-sug>
                    <div className="ui-diff__ln is-add">
                      <i />
                      <i>46</i>
                      <span className="ui-diff__code" data-i="2">
                        <span className="ui-diff__ind">    </span>
                        <span className="k">if</span> (sizeBytes &gt;{' '}
                        <mark className="ui-diff__w">MAX_INSPECT_BYTES</mark>) <span className="k">return</span> linkToGithub;
                      </span>
                    </div>
                  </div>
                  <div className="ui-diff__thread">
                    <div className="ui-diff__by">
                      <span className="ui-avatar" data-tone="4">MS</span>
                      <span className="ui-diff__name">Mateo Suárez</span>
                      <span className="ui-diff__time">ahora</span>
                      <span className="ui-spacer" />
                      <span className="ui-diff__act" data-diff-act>
                        <button
                          className="ui-btn ui-btn--sm ui-diff__apply"
                          type="button"
                          tabIndex={-1}
                          data-diff-apply
                        >
                          <span className="ui-diff__lbl">Aplicar cambio</span>
                          <i className="ui-diff__spin" aria-hidden="true" />
                        </button>
                        <span className="ui-chip ui-diff__done">
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path
                              d="m4 8.4 2.6 2.6L12 5.4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Aplicado
                        </span>
                      </span>
                    </div>
                    <div className="ui-diff__msg">
                      Usa <code>MAX_INSPECT_BYTES</code> (512 KB) y fija la lectura al{' '}
                      <code>commitSha</code> auditado.
                    </div>
                  </div>
                  <div className="ui-diff__ln">
                    <i>47</i>
                    <i>47</i>
                    <span className="ui-diff__code" data-i="2">
                      <span className="ui-diff__ind">    </span>
                      <span className="k">const</span> audit ={' '}
                      <span className="f">auditSkillContent</span>(mergedFiles);
                    </span>
                  </div>
                  <div className="ui-diff__ln is-del">
                    <i>48</i>
                    <i />
                    <span className="ui-diff__code" data-i="2">
                      <span className="ui-diff__ind">    </span>
                      <span className="k">return</span> unverifiedPreview;
                    </span>
                  </div>
                  <div className="ui-diff__ln is-add">
                    <i />
                    <i>48</i>
                    <span className="ui-diff__code" data-i="2">
                      <span className="ui-diff__ind">    </span>
                      <span className="k">return</span>{' '}
                      <mark className="ui-diff__w">
                        <span className="f">renderInertSourceWithCopy</span>(content, audit)
                      </mark>
                      ;
                    </span>
                  </div>
                  <div className="ui-diff__ln is-add">
                    <i />
                    <i>49</i>
                    <span className="ui-diff__code" data-i="2">
                      <span className="ui-diff__ind">    </span>auditBadge.
                      <span className="f">refresh</span>(
                      <span className="s">&quot;commit-pinned&quot;</span>, commitSha);
                    </span>
                  </div>
                  <div className="ui-diff__ln">
                    <i>49</i>
                    <i>50</i>
                    <span className="ui-diff__code" data-i="1">
                      <span className="ui-diff__ind">  </span>&#125;
                    </span>
                  </div>
                  <div className="ui-diff__ln">
                    <i>50</i>
                    <i>51</i>
                    <span className="ui-diff__code" data-i="1">
                      <span className="ui-diff__ind">  </span>
                      <span className="k">return</span>{' '}
                      <span className="f">syncInstallPanel</span>(skill, audit);
                    </span>
                  </div>
                  <div className="ui-diff__ln">
                    <i>51</i>
                    <i>52</i>
                    <span className="ui-diff__code" data-i="0">&#125;</span>
                  </div>
                  <div className="ui-diff__ln">
                    <i>52</i>
                    <i>53</i>
                    <span className="ui-diff__code" data-i="0" />
                  </div>
                  <div className="ui-diff__ln">
                    <i>53</i>
                    <i>54</i>
                    <span className="ui-diff__code" data-i="0">
                      <span className="k">export</span> &#123; inspectSkillFileAtSha &#125;;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPACIDADES (Split-text-left + Diagrama de flujo con iconos reales) */}
      <section className="section" id="capabilities" aria-labelledby="capabilities-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5 split-col">
              <h2 id="capabilities-h">Conecta directivas SKILL.md con todo tu flujo</h2>
              <p>
                Un único estándar sincroniza auditoría por commitSha, directorio
                skills.sh, componentes UI accesibles y clases del equipo sin copias
                locales.
              </p>
              <ul className="checks">
                <li>Lectura bajo demanda desde GitHub fijada al commitSha auditado</li>
                <li>Traducción fiel al español de documentación Markdown en un clic</li>
                <li className="hidden sm:block">Componentes UI accesibles probados con navegación por teclado</li>
              </ul>
              <div className="split-col__end">
                <a
                  className="link"
                  href="#benchmarks"
                  onClick={(e) => openModule(e, 'codice-studio')}
                >
                  Explorar clases en Códice
                </a>
              </div>
            </div>

            <div className="span-6 start-7 panel">
              <div ref={diagramRef} className="dg" data-diagram>
                <script
                  type="application/json"
                  dangerouslySetInnerHTML={{ __html: HUB_DIAGRAM_JSON }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ECOSISTEMA Y MÓDULOS ACTIVOS (Momento dealt: iris-opens sobre ground-surface) */}
      <section
        className="section ground-surface"
        id="benchmarks"
        data-moment="iris-opens"
        data-moment-opts='{"from": "base"}'
        aria-labelledby="benchmarks-h"
      >
        <div className="wrap">
          <div className="grid">
            <div className="span-5 split-col">
              <h2 id="benchmarks-h">Cinco módulos integrados en Códice Studio</h2>
              <p>
                Cada módulo opera sobre repositorios reales de GitHub y componentes
                accesibles del estudio, con votos, reportes por modelo e inspección bajo
                demanda en cada ficha.
              </p>
              <dl className="stats">
                <div>
                  <dt className="t-small muted">Trazabilidad</dt>
                  <dd className="t-stat">commitSha</dd>
                </div>
                <div>
                  <dt className="t-small muted">Límite seguro</dt>
                  <dd className="t-stat">512 KB</dd>
                </div>
              </dl>
              <div className="split-col__end">
                <a
                  className="link"
                  href="#faq"
                  onClick={(e) => openModule(e, 'catalogo')}
                >
                  Abrir catálogo comunitario
                </a>
              </div>
            </div>

            <ul className="rows span-6 start-7">
              <li>
                <span className="rows__name">Skills del equipo</span>
                <p>Publicación directa en GitHub, historial y perfiles · SKILL.md</p>
                <span className="rows__value">Equipo</span>
              </li>
              <li>
                <span className="rows__name">Catálogo comunitario</span>
                <p>Votos, auditoría de seguridad y veredictos por modelo · Issue</p>
                <span className="rows__value">Catálogo</span>
              </li>
              <li>
                <span className="rows__name">Explorar skills.sh</span>
                <p>Vista previa en solo lectura fijada a commitSha e importación · Live</p>
                <span className="rows__value">skills.sh</span>
              </li>
              <li className="sm-row-hidden">
                <span className="rows__name">Componentes UI</span>
                <p>20 piezas accesibles con demostración en vivo y código real · A11y</p>
                <span className="rows__value">Kit propio</span>
              </li>
              <li className="sm-row-hidden">
                <span className="rows__name">Códice de clases</span>
                <p>Lecciones en SafeMarkdown vinculadas a skills y componentes · Equipo</p>
                <span className="rows__value">Obsidian</span>
              </li>
              <li className="sm-row-hidden">
                <span className="rows__name">Inspector bajo demanda</span>
                <p>Lectura inerte de scripts y re-auditoría automática · SHA</p>
                <span className="rows__value">512 KB</span>
              </li>
              <li className="sm-row-hidden">
                <span className="rows__name">Reportes por modelo</span>
                <p>Evaluación práctica de modelos integrada en cada ficha · Veredicto</p>
                <span className="rows__value">GitHub</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (Split FAQ abierto, cero acordeones cerrados) */}
      <section className="section" id="faq" aria-labelledby="faq-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5 split-col">
              <h2 id="faq-h">Preguntas sobre Códice Studio y tus skills</h2>
              <p className="muted">
                Inspección segura por commitSha, vista previa de skills.sh, sesión OAuth
                en memoria y permisos de publicación.
              </p>
              <dl className="stats hidden sm:grid">
                <div>
                  <dt className="t-small muted">Token OAuth</dt>
                  <dd className="t-stat">En memoria</dd>
                </div>
                <div>
                  <dt className="t-small muted">Lectura</dt>
                  <dd className="t-stat">commitSha</dd>
                </div>
              </dl>
              <div className="split-col__end">
                <svg
                  className="w-8 h-8 text-[#0ea5e9]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            <div className="faq span-6 start-7">
              <div className="faq__item">
                <h3>01. Seguridad de inspección: ¿se ejecutan los scripts en el navegador?</h3>
                <p>
                  No. Cada archivo distinto de SKILL.md se descarga bajo demanda desde su
                  commitSha en GitHub y se muestra como texto plano inerte con re-auditoría.
                </p>
              </div>
              <div className="faq__item">
                <h3>02. Integridad por commit: ¿por qué se fija la lectura a un commitSha?</h3>
                <p>
                  Para garantizar que los scripts leídos en Archivos y verificados por
                  AuditBadge coinciden exactamente con la revisión auditada antes de instalar.
                </p>
              </div>
              <div className="faq__item">
                <h3>03. Directorio externo: ¿cómo funciona Explorar (skills.sh)?</h3>
                <p>
                  Las skills alojadas en GitHub se abren en vista previa de solo lectura con
                  traducción y archivos bajo demanda; las fuentes .well-known conservan npx.
                </p>
              </div>
              <div className="faq__item sm-faq-hidden">
                <h3>04. Acceso de visitante: ¿necesito cuenta para consultar el estudio?</h3>
                <p>
                  No. Puedes explorar Catálogo, Equipos, Explorar, Componentes y Códice sin
                  sesión; GitHub OAuth solo se pide al publicar, votar, reportar o importar.
                </p>
              </div>
              <div className="faq__item sm-faq-hidden">
                <h3>05. Privacidad y Markdown: ¿dónde vive mi sesión de GitHub?</h3>
                <p>
                  El token OAuth permanece únicamente en memoria durante la pestaña activa y
                  todo Markdown externo se sanea con SafeMarkdown antes de mostrarse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
