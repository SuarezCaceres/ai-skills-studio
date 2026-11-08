import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), payment=()',
};

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

export default defineConfig({
  base: './',
  plugins: [...preservePublicKitAssets(), react(), tailwindcss()],
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
});
