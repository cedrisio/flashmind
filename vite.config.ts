import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // single source of truth: package.json version -> footer badge at build time
    __APP_VERSION__: JSON.stringify(`v${pkg.version}`),
  },
})
