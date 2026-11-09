import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

const siteUrl = 'https://parsasaeednia.github.io/vue3-selectkit/'

export default defineConfig({
  title: 'vue3-selectkit',
  description:
    'A Vue 3 select that works your way. Typed values, flexible slots, async search and virtualization.',
  base: '/vue3-selectkit/',
  cleanUrls: true,
  sitemap: { hostname: siteUrl },
  transformHead({ pageData, title, description }) {
    if (pageData.relativePath === '404.md') return []
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = new URL(path, siteUrl).href
    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'vue3-selectkit' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
    ]
  },
  markdown: { headers: { level: [2] } },
  head: [
    ['meta', { name: 'theme-color', content: '#059669' }],
    [
      'meta',
      {
        name: 'google-site-verification',
        content: 'gubUHvsJZwEagUs38UBx7FyURi-GVPHwlU4JCV9bJA4',
      },
    ],
  ],
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
