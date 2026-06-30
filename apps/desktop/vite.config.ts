import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@roki/core': path.resolve(__dirname, '../../packages/core/src'),
      '@roki/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@roki/ai': path.resolve(__dirname, '../../packages/ai/src'),
      '@roki/capture': path.resolve(__dirname, '../../packages/capture/src'),
      '@roki/config': path.resolve(__dirname, '../../packages/config/src'),
      '@roki/prompts': path.resolve(__dirname, '../../packages/prompts/src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
});
