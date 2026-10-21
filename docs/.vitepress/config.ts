import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  title: 'vue3-selectkit',
  description:
    'A Vue 3 select that works your way. Typed values, flexible slots, async search and virtualization.',
  base: '/vue3-selectkit/',
  cleanUrls: true,
  markdown: { headers: { level: [2] } },
  head: [['meta', { name: 'theme-color', content: '#059669' }]],
  vite: {
    resolve: {
      alias: [
        {
          find: /^vue3-selectkit$/,
          replacement: fileURLToPath(
            new URL('../../packages/selectkit/src/index.ts', import.meta.url),
          ),
        },
        {
          find: 'vue3-selectkit/style.css',
          replacement: fileURLToPath(
            new URL('../../packages/selectkit/src/style.css', import.meta.url),
          ),
        },
      ],
    },
  },
})
