/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages serves project sites from /<repo-name>/, so the Vite base
// must match the repository name. We read it from an env var so the same
// config works locally (base "/") and in CI (base "/streamdeck/").
// See .github/workflows/deploy.yml for how VITE_BASE_PATH is set.
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors the "@/*" -> "src/*" mapping in tsconfig.app.json. That
      // tsconfig path is only understood by the TypeScript type checker;
      // Vite (dev server, production build) and Vitest both need their
      // own alias entry to actually resolve "@/..." imports at runtime.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
