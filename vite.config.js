import { defineConfig } from 'vite';

// No GitHub Pages o site fica em /pavonia-portfolio/. Em dev e em outra hospedagem, na raiz.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/pavonia-portfolio/') : '/',
}));
