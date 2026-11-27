import React, { useEffect, useRef } from 'react';

interface WorkshopLightProps {
  reduceMotion: boolean;
  finePointer: boolean;
}

const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * Haz de luz volumétrico de ventana adaptado a Cyber Dark (#0a0d14) y cian (#0ea5e9).
 * Un único triángulo a pantalla completa sin dependencias externas: pausa fuera de vista y en pestaña oculta.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uBase;
uniform vec3 uLight;
uniform float uIntensity;
uniform float uDust;
uniform float uGrain;
uniform float uCursor;
uniform float uReveal;

out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float unit = min(uRes.x, uRes.y);
  vec2 p = frag / unit;
  vec2 size = uRes / unit;
  vec2 mouse = uMouse * size;
  float t = uTime;

  float sway = sin(t * 0.07) * 0.035 + (uMouse.x - 0.5) * 0.08 * uCursor;
  vec2 dir = normalize(vec2(0.62 + sway, -1.0));
  vec2 origin = vec2(size.x * 0.08, size.y + 0.32);
  vec2 d = p - origin;
  float along = dot(d, dir);
  float across = dot(d, vec2(-dir.y, dir.x));
  float width = 0.2 + along * 0.24;
  float open = smoothstep(0.0, 1.0, uReveal);
  float reach = width * mix(0.08, 1.0, open);
  float shape = smoothstep(reach, reach * 0.3, abs(across)) * smoothstep(0.0, 0.35, along) * exp(-along * 0.5) * open;

  float a = across / width;
  shape *= 1.0 - 0.5 * smoothstep(0.07, 0.0, abs(a));
  shape *= 1.0 - 0.35 * smoothstep(0.05, 0.0, abs(along - 0.85));

  float beam = 0.0;
  float dust = 0.0;

  if (shape > 0.001) {
    float haze = fbm(p * vec2(2.2, 3.0) + vec2(t * 0.03, -t * 0.045));
    float shafts = noise(vec2(across * 13.0, t * 0.12));
    beam = shape * (0.5 + 0.9 * haze) * (0.72 + 0.5 * shafts);

    for (int l = 0; l < 2; l++) {
      float fl = float(l);
      float scale = 22.0 + fl * 16.0;
      vec2 q = p * scale;
      q.y -= t * (0.35 + fl * 0.2);
      q.x += sin(t * 0.25 + fl * 2.0 + q.y * 0.08) * 0.6;
      vec2 id = floor(q);
      vec2 f = fract(q) - 0.5;
      float h = hash(id + fl * 13.1);
      vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
      float r = length(f - offset * 0.7);
      float twinkle = 0.55 + 0.45 * sin(t * (0.8 + h * 2.0) + h * 30.0);
      dust += step(0.86, h) * smoothstep(mix(0.05, 0.12, h), 0.0, r) * twinkle * (1.0 - fl * 0.35);
    }
    dust *= smoothstep(0.02, 0.35, shape);
  }

  vec2 m = p - mouse;
  float glow = exp(-dot(m, m) * 7.0) * uCursor;
  vec3 col = uBase + uLight * (beam * uIntensity + dust * uDust * 0.45 + glow * 0.055);
  col *= mix(0.76, 1.0, smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.2, 1.0))));
  col += (hash(frag + fract(t * 7.3) * 91.0) - 0.5) * uGrain;

  fragColor = vec4(col, 1.0);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const WorkshopLight: React.FC<WorkshopLightProps> = ({ reduceMotion, finePointer }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flagsRef = useRef({ reduceMotion, finePointer });
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    flagsRef.current = { reduceMotion, finePointer };
    syncRef.current();
  }, [reduceMotion, finePointer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let teardown = () => {};

    const setup = () => {
      const gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: false,
        powerPreference: 'low-power',
      });
      if (!gl) return () => {};

      const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const program = gl.createProgram();
      const vao = gl.createVertexArray();
      if (!vertex || !fragment || !program) return () => {};

      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return () => {};

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      const at = (name: string) => gl.getUniformLocation(program, name);
      const uRes = at('uRes');
      const uTime = at('uTime');
      const uMouse = at('uMouse');
      const uReveal = at('uReveal');
      const uCursor = at('uCursor');

      // Base carbón oficial #0a0d14 y luz cian oficial #0ea5e9.
      gl.uniform3fv(at('uBase'), [0.039, 0.051, 0.078]);
      gl.uniform3fv(at('uLight'), [0.14, 0.68, 0.94]);
      gl.uniform1f(at('uIntensity'), 0.22);
      gl.uniform1f(at('uDust'), 0.55);
      gl.uniform1f(at('uGrain'), 0.02);

      const target = { x: 0.32, y: 0.68 };
      const mouse = { ...target };
      const rect = { left: 0, top: 0, width: 1, height: 1 };
      let frame = 0;
      let visible = true;
      let last = performance.now();
      let time = 0;
      let stale = false;

      const resize = () => {
        const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.72;
        const width = Math.max(1, Math.round(canvas.clientWidth * scale));
        const height = Math.max(1, Math.round(canvas.clientHeight * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        gl.uniform2f(uRes, width, height);
      };

      const measure = () => {
        const box = canvas.getBoundingClientRect();
        stale = false;
        rect.left = box.left;
        rect.top = box.top;
        rect.width = box.width || 1;
        rect.height = box.height || 1;
      };

      const markStale = () => {
        stale = true;
      };

      const draw = (now: number) => {
        const { reduceMotion: still, finePointer: fine } = flagsRef.current;
        time += Math.min(now - last, 50) * 0.001;
        last = now;
        mouse.x += (target.x - mouse.x) * 0.04;
        mouse.y += (target.y - mouse.y) * 0.04;

        gl.uniform1f(uTime, still ? 12 : time);
        gl.uniform1f(uReveal, still ? 1 : Math.min(1, time / 1.4));
        gl.uniform1f(uCursor, fine && !still ? 0.35 : 0);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const loop = (now: number) => {
        draw(now);
        frame = window.requestAnimationFrame(loop);
      };

      const stop = () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
      };

      const sync = () => {
        const { reduceMotion: still } = flagsRef.current;
        const run = !still && visible && !document.hidden;
        if (run && !frame) {
          last = performance.now();
          frame = window.requestAnimationFrame(loop);
        } else if (!run && frame) {
          stop();
        }
        if (!run) draw(performance.now());
      };

      const handlePointer = (event: PointerEvent) => {
        if (!flagsRef.current.finePointer || flagsRef.current.reduceMotion) return;
        if (stale) measure();
        target.x = (event.clientX - rect.left) / rect.width;
        target.y = 1 - (event.clientY - rect.top) / rect.height;
      };

      const resizeObserver = new ResizeObserver(() => {
        resize();
        measure();
        if (!frame) draw(performance.now());
      });

      const viewObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });

      resize();
      measure();
      draw(performance.now());
      canvas.dataset.ready = 'true';
      syncRef.current = sync;
      sync();

      resizeObserver.observe(canvas);
      viewObserver.observe(canvas);
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('scroll', markStale, { passive: true });
      window.addEventListener('pointermove', handlePointer, { passive: true });

      return () => {
        stop();
        syncRef.current = () => {};
        resizeObserver.disconnect();
        viewObserver.disconnect();
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('scroll', markStale);
        window.removeEventListener('pointermove', handlePointer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
      };
    };

    const handleLost = (event: Event) => {
      event.preventDefault();
      teardown();
      teardown = () => {};
    };
    const handleRestored = () => {
      teardown = setup();
    };

    teardown = setup();
    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);

    return () => {
      teardown();
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fg-light-layer">
      <div className="fg-light-fallback" />
      <canvas ref={canvasRef} className="fg-light-canvas" />
    </div>
  );
};
