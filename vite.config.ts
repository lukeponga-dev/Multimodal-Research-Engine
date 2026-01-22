import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const root = path.resolve('.');
  const env = loadEnv(mode, root, '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': root,
      },
    },
    define: {
      // Polyfill process.env.API_KEY for the client bundle
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});