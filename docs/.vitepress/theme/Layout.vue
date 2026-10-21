<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useData, withBase, useRoute } from 'vitepress'
const { frontmatter, page } = useData()
const route = useRoute()
const menu = ref(false)
const dark = ref(false)
const guideLinks = [
  ['Getting started', 'getting-started'],
  ['Basic usage', 'basic-usage'],
  ['Value mapping', 'value-mapping'],
  ['Async options', 'async-options'],
  ['Create options', 'create-options'],
  ['Virtual scrolling', 'virtual-scrolling'],
  ['Styling', 'styling'],
  ['RTL', 'rtl'],
  ['Accessibility', 'accessibility'],
  ['Forms', 'forms'],
]
const toggleTheme = () => {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  localStorage.setItem('vsk-theme', dark.value ? 'dark' : 'light')
}
onMounted(() => {
  dark.value =
    localStorage.getItem('vsk-theme') === 'dark' ||
    (!localStorage.getItem('vsk-theme') && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark.value)
})
watch(
  () => route.path,
  () => {
    menu.value = false
  },
)
</script>
<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <a :href="withBase('/')" class="wordmark">vue3-selectkit</a>
    <nav aria-label="Main navigation">
      <a
        :href="withBase('/guide/getting-started')"
        :class="{ active: !frontmatter.playground && !route.path.includes('/api/') }"
        >Guide</a
      >
      <a :href="withBase('/')" :class="{ active: frontmatter.playground }">Playground</a>
      <a :href="withBase('/api/props')" :class="{ active: route.path.includes('/api/') }">API</a>
    </nav>
    <div class="header-actions">
      <button
        class="theme-toggle"
        :aria-label="dark ? 'Use light theme' : 'Use dark theme'"
        @click="toggleTheme"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </svg></button
      ><a href="https://github.com/ParsaSaeednia/vue3-selectkit" target="_blank" rel="noreferrer"
        >GitHub</a
      ><button
        class="menu-toggle"
        :aria-expanded="menu"
        aria-controls="docs-sidebar"
        @click="menu = !menu"
      >
        Menu
      </button>
    </div>
  </header>
  <aside
    id="docs-sidebar"
    class="sidebar"
    :class="{ visible: menu }"
    aria-label="Documentation navigation"
  >
    <strong>Guide</strong>
    <a
      v-for="[label, path] in guideLinks"
      :key="path"
      :href="withBase(`/guide/${path}`)"
      :class="{ active: route.path.includes(`/guide/${path}`) }"
      :aria-current="route.path.includes(`/guide/${path}`) ? 'page' : undefined"
      >{{ label }}</a
    >
    <div class="sidebar-separator"></div>
    <strong>Reference</strong>
    <a
      v-for="kind in ['Props', 'Events', 'Slots']"
      :key="kind"
      :href="withBase(`/api/${kind.toLowerCase()}`)"
      :class="{ active: route.path.includes(`/api/${kind.toLowerCase()}`) }"
      >{{ kind }}</a
    >
    <div class="sidebar-bottom">
      <a href="https://www.npmjs.com/package/vue3-selectkit">npm · v0.1.0</a>
    </div>
  </aside>
  <main id="main" :class="['site-main', { 'playground-main': frontmatter.playground }]">
    <Content :class="frontmatter.playground ? 'playground-content' : 'article'" />
    <aside
      v-if="!frontmatter.playground && page.headers.length"
      class="page-outline"
      aria-label="On this page"
    >
      <strong>On this page</strong
      ><a v-for="h in page.headers" :key="h.slug" :href="`#${h.slug}`">{{ h.title }}</a>
    </aside>
  </main>
  <footer v-if="!frontmatter.playground" class="site-footer">MIT licensed · Built for Vue 3</footer>
</template>
