import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load environment variables from .env files (for local development)
    const fileEnv = loadEnv(mode, process.cwd(), '');

    // Use process.env for system environment variables (Netlify), with fallback to fileEnv
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY || '';
    const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || fileEnv.VITE_GOOGLE_MAPS_API_KEY || '';
    const GOOGLE_MAPS_MAP_ID = process.env.VITE_GOOGLE_MAP_ID || fileEnv.VITE_GOOGLE_MAP_ID || '';
    
    // Debug: Log to verify keys are being read
    if (GOOGLE_MAPS_API_KEY) {
      console.log('[Vite Config] Google Maps API Key detected');
    }
    if (GOOGLE_MAPS_MAP_ID) {
      console.log('[Vite Config] Map ID detected and will be injected');
    }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api || fileEnv.GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',allowedHosts: ['3000-i84pja3c42esv3sdda6ju-cc9e6f5c.manusvm.computer'],
      },

      plugins: [
        react(),
        createHtmlPlugin({
          minify: true,
        }),
        {
          name: 'inject-api-key-and-map-id',
          transformIndexHtml: {
            order: 'post',
            handler(html) {
              return html
                .replace(/'__VITE_GOOGLE_MAPS_API_KEY__'/g, `'${GOOGLE_MAPS_API_KEY}'`)
                .replace(/'__VITE_GOOGLE_MAP_ID__'/g, `'${GOOGLE_MAPS_MAP_ID}'`);
            },
          },
        },
      ],

      define: {
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        // Expose Supabase keys without VITE_ prefix to prevent automatic bundling
        'process.env.SUPABASE_URL': JSON.stringify(SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY),
        // Google Maps configuration
        'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(GOOGLE_MAPS_API_KEY),
        'import.meta.env.VITE_GOOGLE_MAP_ID': JSON.stringify(GOOGLE_MAPS_MAP_ID),

      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
