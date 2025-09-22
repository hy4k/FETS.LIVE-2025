import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@lib': resolve(__dirname, './src/lib'),
        '@contexts': resolve(__dirname, './src/contexts'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'framer-motion'],
            query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true
    },
    preview: {
      port: 4173,
      host: true
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js', '@tanstack/react-query'],
    },
    // Ensure environment variables are available
    define: {
      __VITE_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL),
      __VITE_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  }
})