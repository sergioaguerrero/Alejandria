import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Injects `<link rel="preconnect">` and `<link rel="dns-prefetch">` for the
 * configured `VITE_API_URL` origin at build time so browsers warm up the TLS
 * connection to Render before the first API call fires.
 */
function apiPreconnectPlugin(apiUrl) {
  let apiOrigin = '';
  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        apiOrigin = parsed.origin;
      }
    } catch {
      apiOrigin = '';
    }
  }

  return {
    name: 'alejandria-api-preconnect',
    transformIndexHtml(html) {
      if (!apiOrigin) return html;
      return {
        html,
        tags: [
          {
            tag: 'link',
            attrs: { rel: 'preconnect', href: apiOrigin, crossorigin: '' },
            injectTo: 'head',
          },
          {
            tag: 'link',
            attrs: { rel: 'dns-prefetch', href: apiOrigin },
            injectTo: 'head',
          },
        ],
      };
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), apiPreconnectPlugin(env.VITE_API_URL)],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: 'mui-vendor',
                test: /node_modules[\\/](@mui|@emotion)[\\/]/,
                priority: 20,
              },
              {
                name: 'charts-vendor',
                test: /node_modules[\\/](recharts|d3-|victory-vendor)[\\/]/,
                priority: 15,
              },
              {
                name: 'pdf-vendor',
                test: /node_modules[\\/](jspdf|html2canvas|fflate|canvg|dompurify)[\\/]/,
                priority: 15,
              },
            ],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
