import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    // Polyfill seguro para process.env para evitar crashes de libs legadas,
    // mas mantendo o foco em import.meta.env para o código da aplicação.
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        VITE_GEMINI_API_KEY: JSON.stringify(env.VITE_GEMINI_API_KEY),
        VITE_FREEPIK_API_KEY: JSON.stringify(env.VITE_FREEPIK_API_KEY),
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        // Fallbacks comuns para chaves de API
        API_KEY: JSON.stringify(env.API_KEY),
        GOOGLE_API_KEY: JSON.stringify(env.GOOGLE_API_KEY),
      }
    }
  };
});