import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages serves project sites from /<repo-name>/, so the Vite base
// must match the repository name. We read it from an env var so the same
// config works locally (base "/") and in CI (base "/streamdeck/").
// See .github/workflows/deploy.yml for how VITE_BASE_PATH is set.
const base = process.env.VITE_BASE_PATH ?? '/'

// Using vitest/config's defineConfig (instead of plain vite's) gives the
// `test` field below a proper type out of the box, so no ambient
// "/// <reference types="vitest/config" />" merge is needed and `tsc -b`
// type-checks this file correctly under tsconfig.node.json.
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
