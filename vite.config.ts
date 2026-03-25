import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      '/api/tripay': {
        target: 'https://tripay.co.id/api-sandbox',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/tripay/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Authorization', 'Bearer DEV-D7T1aMwz66CRCUp1AfMtX28aNnI3kr1CS2FGiWc0');
            console.log('Proxying request to:', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received response from Tripay:', proxyRes.statusCode, 'for', req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
        },
      },
      // Proxy lokal untuk SSCASN — development only
      // Pakai api-sscasn.vercel.app karena path-nya sama (/formasi, /ref/instansi, dll)
      // Tidak ada CORS karena request ini dari Vite server, bukan browser
      // Di production, /api/sscasn/* ditangani Netlify Function
      '/api/sscasn': {
        target: 'https://api-sscasn.vercel.app/api',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/sscasn/, ''),
      },
      '/api/telegram-notify': {
        target: 'http://localhost:8888/.netlify/functions/telegram-notify',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/telegram-notify/, ''),
      },
    },
  },
});
