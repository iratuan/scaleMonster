import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base relativo: o mesmo build funciona na web, dentro do Electron (file://) e no Capacitor.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
