import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import type { InlineConfig } from 'vitest/node'

// GitHub Pages serves project sites from /<repo-name>/, so the Vite base
// must match the repository name. We read it from an env var so the same
// config works locally (base "/") and in CI (base "/streamdeck/").
// See .github/workflows/deploy.yml for how VITE_BASE_PATH is set.
const base = process.env.VITE_BASE_PATH ?? '/'

// We intentionally import `defineConfig` from plain "vite" (not
// "vitest/config") to avoid a TypeScript error caused by vitest bundling
// its own nested copy of vite: importing defineConfig from vitest/config
// resolves Plugin/PluginOption types against that nested vite copy, which
// then structurally conflicts with @vitejs/plugin-react's top-level-vite
// Plugin type. Importing only vitest's `InlineConfig` *type* (not its
// defineConfig) avoids pulling in that nested-vite type graph while still
// giving the `test` field below full type-checking.
type ViteConfigWithTest = UserConfig & { test?: InlineConfig }

const config: ViteConfigWithTest = {
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
}

export default defineConfig(config)
