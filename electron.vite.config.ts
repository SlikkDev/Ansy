import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Content security policy for Ansy's own screens. Production allows nothing
 * but the app's own files. Development adds what Vite's hot reload needs.
 */
const policy = (isDev: boolean) =>
  [
    "default-src 'self'",
    isDev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    isDev ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    isDev ? "connect-src 'self' ws://localhost:* http://localhost:*" : "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ')

const csp = (isDev: boolean): Plugin => ({
  name: 'ansy-csp',
  transformIndexHtml: (html) => html.replace('%CSP%', policy(isDev)),
})

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      build: { lib: { entry: resolve('src/main/index.ts') } },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: { lib: { entry: resolve('src/preload/index.ts') } },
    },
    renderer: {
      root: resolve('src/renderer'),
      build: { minify: true, rollupOptions: { input: resolve('src/renderer/index.html') } },
      plugins: [react(), tailwindcss(), csp(isDev)],
    },
  }
})
