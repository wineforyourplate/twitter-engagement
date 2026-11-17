import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'

// Dev-only sign-in: ask the Lemma CLI for the current token on every page load and
// seed it into localStorage before the app boots, so `npm run dev` is signed in as
// whoever the CLI is. Runs only during `serve`, never in a build; nothing is written
// to disk. The server is named explicitly (the CLI's active server can change).
function lemmaDevAuth(env: Record<string, string>): Plugin {
  const command = env.VITE_LEMMA_DEV_TOKEN_CMD ?? 'lemma --server lemma-cloud auth print-token'
  return {
    name: 'lemma-dev-auth',
    apply: 'serve',
    transformIndexHtml() {
      if (!command.trim()) return
      let token = ''
      try {
        token = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
      } catch {
        return
      }
      if (!token) return
      return [{ tag: 'script', injectTo: 'head-prepend', children: `try{localStorage.setItem("lemma_token",${JSON.stringify(token)})}catch(e){}` }]
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev only: the API doesn't allow localhost origins, so the SDK talks to a
  // same-origin /api path and Vite forwards it (set in .env.local).
  const target = env.LEMMA_DEV_PROXY_TARGET
  const server = target
    ? { proxy: { '/api': { target, changeOrigin: true, secure: true, rewrite: (p: string) => p.replace(/^\/api/, '') } } }
    : undefined
  return {
    server,
    // Served at the root of its subdomain; the host can override the base path.
    base: mode === 'production' ? env.VITE_LEMMA_APP_BASE_PATH || '/' : '/',
    plugins: [react(), tailwindcss(), lemmaDevAuth(env)],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
      dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    },
  }
})
