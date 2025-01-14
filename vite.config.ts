import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import path from 'path';
    
    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
      resolve: {
        alias: {
          '@lib': path.resolve(__dirname, 'src/lib'),
          '@components': path.resolve(__dirname, 'src/components'),
        },
      },
      optimizeDeps: {
        exclude: ['lucide-react'],
      },
      server: {
        proxy: {
          '/api/manifest': {
            target: 'http://localhost:5173',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/manifest/, '/manifest.json'),
          },
        },
      },
    });
