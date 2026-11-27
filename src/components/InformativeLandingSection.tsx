import React, { useEffect } from 'react';
import { AppPageRoute } from '../types/workspace';
import './landingScroll.css';
// Hero interactivo estilo Forge (WebGL2 + motion/react) en chunk diferido para mantener el bundle inicial < 350 kB.
const ForgeHeroShowcase = React.lazy(() => import('./hero/ForgeHeroShowcase'));
// Sección de la spec 005 en un chunk aparte: no suma al bundle inicial (presupuesto < 350 kB).
const GuideContrastShowcase = React.lazy(() =>
  import('./GuideContrastShowcase').then((m) => ({ default: m.GuideContrastShowcase }))
);
// Órbita interactiva de agentes IA en chunk diferido para #capabilities (presupuesto < 350 kB).
const CapabilitiesOrbitalShowcase = React.lazy(() => import('./CapabilitiesOrbitalShowcase'));
// Selector interactivo de los 5 módulos con vistas previas autenticadas para #benchmarks (presupuesto < 350 kB).
const EcosystemModulesShowcase = React.lazy(() => import('./EcosystemModulesShowcase'));

interface InformativeLandingSectionProps {
  onNavigatePage: (page: AppPageRoute) => void;
}

declare global {
  interface Window {
    __tasteUi?: {
      startAll: (doc: Document) => void;
    };
  }
}

export const InformativeLandingSection: React.FC<InformativeLandingSectionProps> = ({
  onNavigatePage,
}) => {
  useEffect(() => {
    if (window.__tasteUi) {
      try {
        window.__tasteUi.startAll(document);
      } catch {}
    }

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (reduced || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.setAttribute('data-revealed', 'true'));
      return;
    }

    document.documentElement.classList.add('ld-scroll-ready');

    const revealIfVisible = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94) {
        el.setAttribute('data-revealed', 'true');
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.04, rootMargin: '0px 0px 40px 0px' }
    );

    targets.forEach((el) => {
      if (!revealIfVisible(el)) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('ld-scroll-ready');
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
      {/* 1. HERO ESTILO FORGE (100svh · haz WebGL2 + tablero interactivo de módulos y agentes IA) */}
      <React.Suspense
        fallback={<section className="hero" aria-hidden="true" style={{ minHeight: '100svh' }} />}
      >
        <ForgeHeroShowcase onNavigatePage={onNavigatePage} />
      </React.Suspense>

      {/* 1b. GUÍA VS. SIN GUÍA (spec 005 · ilustrativa, tras el hero) */}
      <React.Suspense
        fallback={<div className="section" aria-hidden="true" style={{ minHeight: '36rem' }} />}
      >
        <GuideContrastShowcase onNavigatePage={onNavigatePage} />
      </React.Suspense>

      {/* 2. APP-FRAME (Lista de archivos de la skill + Inspector bajo demanda fijado a commitSha) */}
      <section className="section" id="inspector" aria-labelledby="inspector-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5">
              <p className="ld-eyebrow" data-reveal="up">
                <span aria-hidden="true" className="ld-eyebrow__bar" />
                <span>Auditoría de material real · SHA</span>
              </p>
              <h2 id="inspector-h" className="ld-heading" data-reveal="mask">
                <span className="ld-heading__mask">
                  <span className="ld-heading__line">Inspecciona cada skill</span>
                </span>
                <span className="ld-heading__mask">
                  <span className="ld-heading__line ld-accent">antes de usarla en clase</span>
                </span>
              </h2>
            </div>
            <div className="span-6 start-7 stack-4">
              <p className="muted" data-reveal="up" data-reveal-delay="1">
                Cada directiva SKILL.md, script o referencia vinculada a una clase se lee bajo
                demanda desde su commitSha en GitHub en texto inerte y se verifica con AuditBadge
                antes de aplicarla en tus proyectos.
              </p>
              <a
                className="link"
                href="#capabilities"
                data-reveal="up"
                data-reveal-delay="2"
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
            data-reveal="panel"
            data-reveal-delay="2"
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

      {/* 3. CAPACIDADES (Split-text-left + Órbita radial interactiva de agentes IA) */}
      <section className="section" id="capabilities" aria-labelledby="capabilities-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5 split-col">
              <div>
                <p className="ld-eyebrow" data-reveal="up">
                  <span aria-hidden="true" className="ld-eyebrow__bar" />
                  <span>Harness multi-agente · Ahorro de tokens</span>
                </p>
                <h2 id="capabilities-h" className="ld-heading" data-reveal="mask">
                  <span className="ld-heading__mask">
                    <span className="ld-heading__line">Cambia de agente IA</span>
                  </span>
                  <span className="ld-heading__mask">
                    <span className="ld-heading__line ld-accent">sin perder el contexto</span>
                  </span>
                </h2>
              </div>
              <p data-reveal="up" data-reveal-delay="1">
                Aprende a armar tu harness (AGENTS.md, docs/ y SKILL.md) para gastar menos tokens
                y saltar de Claude a Gemini, DeepSeek, ChatGPT u OpenCode cuando se acaben tus
                créditos, continuando exactamente donde te quedaste.
              </p>
              <ul className="checks">
                <li data-reveal="up" data-reveal-delay="2">Consume menos tokens cargando solo el contexto exacto por tarea</li>
                <li data-reveal="up" data-reveal-delay="3">Salto sin fricción entre Claude, Gemini, DeepSeek, ChatGPT y OpenCode</li>
                <li className="hidden sm:block" data-reveal="up" data-reveal-delay="4">Comparte el mismo harness, skills y reglas con todo tu equipo</li>
              </ul>
              <div className="split-col__end" data-reveal="up" data-reveal-delay="4">
                <a
                  className="link"
                  href="#benchmarks"
                  onClick={(e) => openModule(e, 'codice-studio')}
                >
                  Ver clases y harness en Códice
                </a>
              </div>
            </div>

            <div
              className="span-6 start-7 panel"
              style={{ padding: 0 }}
              data-reveal="panel"
              data-reveal-delay="2"
            >
              <React.Suspense
                fallback={<div style={{ minHeight: '480px' }} aria-hidden="true" />}
              >
                <CapabilitiesOrbitalShowcase />
              </React.Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ECOSISTEMA Y MÓDULOS ACTIVOS (Tab Switcher numerado 01–05 + vista previa real autenticada) */}
      <section
        className="section ground-surface"
        id="benchmarks"
        aria-labelledby="benchmarks-h"
      >
        <div className="wrap" data-reveal="panel">
          <React.Suspense
            fallback={<div style={{ minHeight: '560px' }} aria-hidden="true" />}
          >
            <EcosystemModulesShowcase />
          </React.Suspense>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (Split FAQ abierto, cero acordeones cerrados) */}
      <section className="section" id="faq" aria-labelledby="faq-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5 split-col">
              <div>
                <p className="ld-eyebrow" data-reveal="up">
                  <span aria-hidden="true" className="ld-eyebrow__bar" />
                  <span>Preguntas clave · Códice Studio</span>
                </p>
                <h2 id="faq-h" className="ld-heading" data-reveal="mask">
                  <span className="ld-heading__mask">
                    <span className="ld-heading__line">Preguntas sobre clases,</span>
                  </span>
                  <span className="ld-heading__mask">
                    <span className="ld-heading__line ld-accent">equipos y harness IA</span>
                  </span>
                </h2>
              </div>
              <p className="muted" data-reveal="up" data-reveal-delay="1">
                Cómo funcionan los videos con kit desplegable, el harness multi-agente para
                ahorrar tokens, los equipos en GitHub y la auditoría por commitSha.
              </p>
              <dl className="stats hidden sm:grid" data-reveal="up" data-reveal-delay="2">
                <div>
                  <dt className="t-small muted">Infraestructura</dt>
                  <dd className="t-stat">GitHub $0</dd>
                </div>
                <div>
                  <dt className="t-small muted">Agentes IA</dt>
                  <dd className="t-stat">Multi-IA</dd>
                </div>
              </dl>
              <div className="split-col__end" data-reveal="up" data-reveal-delay="3">
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
              <div className="faq__item" data-reveal="up" data-reveal-delay="1">
                <h3>01. ¿Qué diferencia a las clases de un tutorial tradicional?</h3>
                <p>
                  Cada video trae su menú desplegable listo: componentes UI, efectos, skills
                  SKILL.md, modelo IA, nivel, referencias y proyectos enlazados.
                </p>
              </div>
              <div className="faq__item" data-reveal="up" data-reveal-delay="2">
                <h3>02. ¿Cómo ahorra tokens y créditos el harness multi-agente?</h3>
                <p>
                  Ordena reglas y progreso en AGENTS.md y docs/: si agotas créditos en Claude,
                  sigues en Gemini, DeepSeek, ChatGPT u OpenCode sin perder contexto.
                </p>
              </div>
              <div className="faq__item" data-reveal="up" data-reveal-delay="3">
                <h3>03. ¿Puedo crear equipo y subir mis skills y páginas hechas?</h3>
                <p>
                  Sí. Organiza secciones para tu equipo, publica tus SKILL.md y comparte webs o
                  apps hechas con IA enlazadas al video explicativo donde se construyeron.
                </p>
              </div>
              <div className="faq__item sm-faq-hidden" data-reveal="up" data-reveal-delay="4">
                <h3>04. ¿Qué costo o servidor necesita para funcionar en comunidad?</h3>
                <p>
                  Arquitectura ligera con costo base $0 sobre GitHub y videos embebidos
                  (youtube-nocookie), sin servidores cerrados ni bases de datos pesadas.
                </p>
              </div>
              <div className="faq__item sm-faq-hidden" data-reveal="up" data-reveal-delay="5">
                <h3>05. ¿Es seguro revisar skills y código externo antes de usarlo?</h3>
                <p>
                  Sí. Cada archivo se lee bajo demanda desde su commitSha en texto inerte
                  (≤ 512 KB) con AuditBadge, OAuth en memoria y SafeMarkdown.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
