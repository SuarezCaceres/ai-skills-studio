import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
  ];
}

export default defineConfig({
  base: './',
  plugins: [...preservePublicKitAssets(), react(), tailwindcss()],
  server: {
    headers: securityHeaders,
  },
  preview: {
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
