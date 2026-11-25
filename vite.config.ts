import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { handleSkillsShRequest } from './api/skills-sh';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), payment=()',
};

/**
 * Rellena `connect-src` de la CSP de `index.html` con los únicos orígenes a los que
 * la app hace `fetch`: la API de GitHub, la función de Vercel que intercambia el
 * código OAuth (derivada de `VITE_GITHUB_OAUTH_URL`) y la API de Gemini (traducción
 * con la clave de la persona). Sin esto `default-src 'self'` bloquearía el catálogo.
 */
function cspConnectSrc(oauthUrl: string): Plugin {
  const origins = ["'self'", 'https://api.github.com', 'https://generativelanguage.googleapis.com'];
  try {
    const origin = new URL(oauthUrl).origin;
    if (origin.startsWith('https://') || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      origins.push(origin);
    }
  } catch {
    // Sin función de OAuth configurada: la app funciona en modo solo lectura.
  }
  return {
    name: 'csp-connect-src',
    transformIndexHtml(html) {
      return html.replace('__CSP_CONNECT_SRC__', origins.join(' '));
    },
  };
}

function preservePublicKitAssets(): Plugin[] {
  return [
    {
      name: 'preserve-public-kit-assets-pre',
      apply: 'build',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replace(/\bhref="(assets\/[^"]+)"/g, 'data-kit-href="$1"')
            .replace(/\bsrc="(assets\/[^"]+)"/g, 'data-kit-src="$1"');
        },
      },
    },
    {
      name: 'preserve-public-kit-assets-post',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return html
            .replace(/\bdata-kit-href="(assets\/[^"]+)"/g, 'href="$1"')
            .replace(/\bdata-kit-src="(assets\/[^"]+)"/g, 'src="$1"');
        },
      },
    },
    {
      name: 'serve-public-kit-assets-dev',
      apply: 'serve',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          // Strip modulepreload in dev mode so Vite HTML scanner doesn't pre-transform public files
          let devHtml = html.replace(/<link rel="modulepreload" href="assets\/[^"]+"\s*\/?>\s*/g, '');
          // Replace module kit scripts with dynamic loader script so Vite HTML parser doesn't pre-transform public files
          const kitScripts: string[] = [];
          devHtml = devHtml.replace(/<script type="module" src="assets\/([^"]+)"><\/script>/g, (_, file) => {
            kitScripts.push(`'/assets/${file}'`);
            return '';
          });
          if (kitScripts.length > 0) {
            const loader = `<script>
    [${kitScripts.join(', ')}].forEach((src) => {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = src;
      document.body.appendChild(s);
    });
  </script>`;
            devHtml = devHtml.replace('</body>', `  ${loader}\n  </body>`);
          }
          return devHtml
            .replace(/\bhref="assets\//g, 'href="/assets/')
            .replace(/\bsrc="assets\//g, 'src="/assets/');
        },
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/assets/')) {
            const cleanUrl = req.url.split('?')[0];
            const filePath = path.join(__dirname, 'public', cleanUrl);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath);
              const mimeTypes: Record<string, string> = {
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.svg': 'image/svg+xml',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
              };
              res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
              return fs.createReadStream(filePath).pipe(res);
            }
          }
          next();
        });
      },
    },
  ];
}

function skillsShDevProxy(): Plugin {
  return {
    name: 'skills-sh-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || (req.url !== '/api/skills-sh' && !req.url.startsWith('/api/skills-sh?'))) {
          return next();
        }
        const rawHost = String(req.headers.host ?? '');
        const hostname = rawHost.split(':')[0].toLowerCase();
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'origin_not_allowed' }));
          return;
        }
        const secFetchSite = String(req.headers['sec-fetch-site'] ?? '');
        if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'origin_not_allowed' }));
          return;
        }
        const localOrigin = `http://${rawHost}`;
        const allowedOrigins = Array.from(
          new Set([localOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'])
        );
        const headers = new Headers();
        headers.set(
          'origin',
          typeof req.headers.origin === 'string' && req.headers.origin ? req.headers.origin : localOrigin
        );
        try {
          const webReq = new Request(`${localOrigin}${req.url}`, {
            method: req.method ?? 'GET',
            headers,
          });
          const webRes = await handleSkillsShRequest(webReq, { allowedOrigins });
          res.statusCode = webRes.status;
          webRes.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await webRes.text());
        } catch {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'upstream_unavailable' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
  base: './',
  plugins: [...preservePublicKitAssets(), skillsShDevProxy(), cspConnectSrc(env.VITE_GITHUB_OAUTH_URL ?? ''), react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    headers: securityHeaders,
  },
  optimizeDeps: {
    entries: ['src/main.tsx'],
  },
  preview: {
    port: 5173,
    headers: securityHeaders,
  },
  build: {
    assetsDir: 'bundle',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  };
});
