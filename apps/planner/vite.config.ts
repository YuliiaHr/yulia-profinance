import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: the app works under any subpath (/planner/ on GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
})
