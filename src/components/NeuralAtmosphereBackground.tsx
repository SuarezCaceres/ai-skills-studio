import React, { useEffect, useRef } from 'react';
import {
  Cpu,
  Settings,
  Sparkles,
  Network,
  Braces,
  Code2,
  Terminal,
  Binary,
} from 'lucide-react';

/**
 * Representa un nodo o neurona individual dentro de la red
 */
interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  colorType: 'violet' | 'cyan' | 'lavender';
  pulsePhase: number;
  pulseSpeed: number;
  highlight: number; // 0 (reposo) a 1 (activado por cercanía al cursor)
}

/**
 * Impulso eléctrico que viaja entre dos neuronas conectadas
 */
interface SynapticSignal {
  sourceIdx: number;
  targetIdx: number;
  progress: number; // 0.0 a 1.0
  speed: number;
  color: string;
}

/**
 * Onda de choque generada al hacer clic o pulsar en pantalla
 */
interface ShockwaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

/**
 * Atmósfera Visual y Red Neuronal Interactiva (Cyber Violet & Neural Matrix):
 * - Responde en tiempo real al movimiento y posición del mouse (repulsión, atracción, enlaces sinápticos).
 * - Enlaces de energía violeta neón (#8B5CF6 / #C084FC) y cian sináptico (#38BDF8) hacia el cursor.
 * - Impulsos cuánticos y ondas de choque reactivas al clic.
 * - Micro-parallax suave en los glifos de ingeniería.
 * - 60-120 FPS sin bloquear la interacción de la UI (`pointer-events-none`).
 */
export const NeuralAtmosphereBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glyphsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Detectar preferencia de reducción de movimiento
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Ajuste de densidad de píxeles (HiDPI / Retina) tope en 2 para rendimiento
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    // Estado del cursor del mouse
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isActive: false,
      radius: 180, // Radio de interacción e influencia sináptica
    };

    // Colección de ondas de choque activas
    const ripples: ShockwaveRipple[] = [];

    // Densidad adaptativa de nodos según resolución de pantalla
    const calculateNodeCount = () => {
      const area = width * height;
      if (area < 500000) return 36;
      if (area < 1200000) return 55;
      return 78;
    };

    // Inicializar nodos neuronales en tonos violeta, cian y lavanda neón
    const nodeCount = calculateNodeCount();
    const nodes: NeuralNode[] = [];

    const colorVariants: Array<'violet' | 'cyan' | 'lavender'> = [
      'violet',
      'violet',
      'cyan',
      'lavender',
      'violet',
      'cyan',
    ];

    for (let i = 0; i < nodeCount; i++) {
      const speedMultiplier = prefersReducedMotion ? 0.08 : 0.4;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speedMultiplier,
        vy: (Math.random() - 0.5) * speedMultiplier,
        baseRadius: 1.6 + Math.random() * 2.2,
        colorType:
          colorVariants[Math.floor(Math.random() * colorVariants.length)],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        highlight: 0,
      });
    }

    // Señales de pulso sináptico que viajan entre nodos
    const synapticSignals: SynapticSignal[] = [];

    const maybeSpawnSignal = (sourceIdx: number, targetIdx: number) => {
      if (prefersReducedMotion) return;
      if (synapticSignals.length > 8) return;
      if (Math.random() < 0.009) {
        synapticSignals.push({
          sourceIdx,
          targetIdx,
          progress: 0,
          speed: 0.015 + Math.random() * 0.02,
          color: Math.random() > 0.4 ? '#A855F7' : '#38BDF8',
        });
      }
    };

    // Escuchador global de movimiento de cursor
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isActive = true;

      // Parallax sutil en los elementos gráficos flotantes
      if (glyphsContainerRef.current) {
        const deltaX = (e.clientX - width / 2) * 0.014;
        const deltaY = (e.clientY - height / 2) * 0.014;
        glyphsContainerRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      }
    };

    const handlePointerLeave = () => {
      mouse.isActive = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;

      if (glyphsContainerRef.current) {
        glyphsContainerRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      // Disparar onda de choque neuronal reactiva al clic
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: 220,
        alpha: 0.8,
      });
    };

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    window.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    });
    window.addEventListener('pointerdown', handlePointerDown, {
      passive: true,
    });

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Bucle principal de animación (60–120 FPS)
    const connectionDistance = 145;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Suavizar la posición del mouse hacia el cursor real
      if (mouse.isActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.18;
        mouse.y += (mouse.targetY - mouse.y) * 0.18;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * 0.06;
        mouse.y += (mouse.targetY - mouse.y) * 0.06;
      }

      // 1. Procesar Ondas de Choque (Ripples de Clic en Violeta/Cian)
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 5.2;
        rip.alpha *= 0.94;

        ctx.save();
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${rip.alpha * 0.7})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, Math.max(0, rip.radius - 8), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${rip.alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Expulsar sutilmente nodos alcanzados por la onda
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const distToRipple = Math.hypot(n.x - rip.x, n.y - rip.y);
          if (Math.abs(distToRipple - rip.radius) < 28) {
            const angle = Math.atan2(n.y - rip.y, n.x - rip.x);
            n.x += Math.cos(angle) * 1.6;
            n.y += Math.sin(angle) * 1.6;
            n.highlight = Math.min(1, n.highlight + 0.35);
          }
        }

        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          ripples.splice(r, 1);
        }
      }

      // 2. Actualizar Posiciones y Física de los Nodos con Interacción del Cursor
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (mouse.isActive) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius && dist > 0.001) {
            const force = (1 - dist / mouse.radius) * 4.2;
            const angle = Math.atan2(dy, dx);
            node.x += Math.cos(angle) * force;
            node.y += Math.sin(angle) * force;
            node.highlight = Math.min(1, node.highlight + 0.14);
          } else {
            node.highlight = Math.max(0, node.highlight - 0.02);
          }
        } else {
          node.highlight = Math.max(0, node.highlight - 0.02);
        }

        node.x += node.vx;
        node.y += node.vy;

        const margin = 30;
        if (node.x < -margin) node.x = width + margin;
        if (node.x > width + margin) node.x = -margin;
        if (node.y < -margin) node.y = height + margin;
        if (node.y > height + margin) node.y = -margin;

        node.pulsePhase += node.pulseSpeed;
      }

      // 3. Dibujar Sinapsis entre Nodos
      ctx.lineWidth = 1.0;
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDistance) {
            const proximityFactor = 1 - dist / connectionDistance;
            const combinedHighlight = Math.max(
              nodeA.highlight,
              nodeB.highlight
            );

            const baseAlpha = 0.08 * proximityFactor;
            const activeAlpha = baseAlpha + combinedHighlight * 0.38;

            let strokeColor: string;
            if (nodeA.colorType === 'violet' || nodeB.colorType === 'violet') {
              strokeColor = `rgba(139, 92, 246, ${activeAlpha})`;
            } else if (
              nodeA.colorType === 'lavender' ||
              nodeB.colorType === 'lavender'
            ) {
              strokeColor = `rgba(192, 132, 252, ${activeAlpha})`;
            } else {
              strokeColor = `rgba(56, 189, 248, ${activeAlpha * 0.95})`;
            }

            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = strokeColor;
            ctx.stroke();

            maybeSpawnSignal(i, j);
          }
        }
      }

      // 4. Dibujar Enlaces Sinápticos Directos hacia el Cursor del Mouse
      if (mouse.isActive) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const dist = Math.hypot(node.x - mouse.x, node.y - mouse.y);

          if (dist < mouse.radius) {
            const proximity = 1 - dist / mouse.radius;
            const lineAlpha = proximity * 0.58;

            const grad = ctx.createLinearGradient(
              mouse.x,
              mouse.y,
              node.x,
              node.y
            );
            grad.addColorStop(0, `rgba(168, 85, 247, ${lineAlpha})`);
            grad.addColorStop(0.5, `rgba(139, 92, 246, ${lineAlpha * 0.85})`);
            grad.addColorStop(1, `rgba(56, 189, 248, ${lineAlpha * 0.7})`);

            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2 + proximity * 0.8;
            ctx.stroke();
          }
        }

        // Halo suave en la punta virtual del cursor
        ctx.save();
        const cursorGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          32
        );
        cursorGlow.addColorStop(0, 'rgba(168, 85, 247, 0.32)');
        cursorGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
        cursorGlow.addColorStop(1, 'rgba(7, 5, 14, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Dibujar Impulsos Eléctricos Viajeros (Synaptic Signals)
      for (let s = synapticSignals.length - 1; s >= 0; s--) {
        const sig = synapticSignals[s];
        sig.progress += sig.speed;

        const nodeFrom = nodes[sig.sourceIdx];
        const nodeTo = nodes[sig.targetIdx];

        if (!nodeFrom || !nodeTo) {
          synapticSignals.splice(s, 1);
          continue;
        }

        const currX = nodeFrom.x + (nodeTo.x - nodeFrom.x) * sig.progress;
        const currY = nodeFrom.y + (nodeTo.y - nodeFrom.y) * sig.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(currX, currY, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = sig.color;
        ctx.shadowColor = sig.color;
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.restore();

        if (sig.progress >= 1.0) {
          synapticSignals.splice(s, 1);
        }
      }

      // 6. Dibujar los Nodos Neuronales con Brillo y Pulso
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulse = Math.sin(node.pulsePhase) * 0.45;
        const currentRadius = Math.max(
          1.2,
          node.baseRadius + pulse + node.highlight * 1.5
        );

        ctx.save();

        let coreColor = '#8B5CF6';
        let glowColor = 'rgba(139, 92, 246, 0.28)';

        if (node.colorType === 'cyan') {
          coreColor = '#38BDF8';
          glowColor = 'rgba(56, 189, 248, 0.25)';
        } else if (node.colorType === 'lavender') {
          coreColor = '#C084FC';
          glowColor = 'rgba(192, 132, 252, 0.28)';
        }

        if (node.highlight > 0.05) {
          glowColor = `rgba(168, 85, 247, ${0.3 + node.highlight * 0.55})`;
        }

        // Halo difuso
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 3.4, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Núcleo del nodo
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = node.highlight > 0 ? 14 : 6;
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        contain: 'strict',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Capa 1: Gradiente base en Noche Obsidiana con Auras Violeta y Cian */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.05) 30%, transparent 60%), radial-gradient(circle at 82% 80%, rgba(56, 189, 248, 0.1) 0%, rgba(14, 165, 233, 0.03) 35%, transparent 65%), radial-gradient(circle at 75% 15%, rgba(192, 132, 252, 0.08) 0%, transparent 48%), linear-gradient(175deg, #07050E 0%, #0C081A 45%, #120D24 85%, #07050E 100%)',
        }}
      />

      {/* Capa 2: Malla sutil repetitiva de constelaciones tecnológicas */}
      <div className="neural-mesh-pattern absolute inset-0 opacity-60" />

      {/* Capa 3: CANVAS DINÁMICO INTERACTIVO - RED NEURONAL VIVA */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full block"
        style={{
          touchAction: 'none',
        }}
      />

      {/* Capa 4: Elementos gráficos flotantes discretos con micro-parallax interactivo */}
      <div
        ref={glyphsContainerRef}
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
      >
        <div className="neural-floating-glyph absolute left-[4%] top-[15%] flex items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-[#120D24]/70 px-3 py-2 backdrop-blur-xs">
          <Braces className="h-5 w-5 text-[#C084FC]/80" />
          <span className="font-mono text-xs font-bold tracking-widest text-purple-200/70">
            {'{ AI }'}
          </span>
        </div>

        <div className="neural-floating-glyph-delayed absolute right-[5%] top-[16%] flex items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-[#120D24]/70 px-3 py-2">
          <Cpu className="h-5 w-5 text-[#8B5CF6]/80" />
          <span className="font-mono text-[10px] font-semibold text-purple-200/60">
            NEURAL·CORE
          </span>
        </div>

        <div className="neural-floating-glyph-delayed absolute left-[3%] top-[52%] rounded-full border border-purple-500/30 bg-[#120D24]/60 p-2.5">
          <Network className="h-5 w-5 text-[#A855F7]/70" />
        </div>

        <div className="neural-floating-glyph absolute right-[3.5%] top-[48%] rounded-full border border-sky-500/30 bg-[#120D24]/60 p-2.5">
          <Settings className="h-5 w-5 text-sky-400/65" />
        </div>

        <div className="neural-floating-glyph absolute bottom-[14%] left-[6%] flex items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-[#120D24]/60 px-3 py-1.5">
          <Code2 className="h-4 w-4 text-[#C084FC]/75" />
          <span className="font-mono text-[11px] font-bold text-purple-200/65">
            {'</skills>'}
          </span>
        </div>

        <div className="neural-floating-glyph-delayed absolute bottom-[12%] right-[7%] flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-[#120D24]/60 px-3 py-1.5">
          <Sparkles className="h-4 w-4 text-[#8B5CF6]/75" />
          <Terminal className="h-4 w-4 text-sky-400/70" />
          <Binary className="h-4 w-4 text-purple-200/60" />
        </div>
      </div>
    </div>
  );
};
