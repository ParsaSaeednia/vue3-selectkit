import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'selectkit.js',
      cssFileName: 'style',
    },
    rollupOptions: { external: ['vue', '@floating-ui/vue', '@tanstack/vue-virtual'] },
  },
})
