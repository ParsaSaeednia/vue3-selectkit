<script setup lang="ts">
import { propDocs, eventDocs, slotDocs } from './metadata'
defineProps<{ kind: 'props' | 'events' | 'slots' }>()
const kebab = (s: string) => s.replace(/[A-Z]/g, (x) => `-${x.toLowerCase()}`)
</script>
<template>
  <div v-if="kind === 'props'" class="api-definitions">
    <section v-for="(info, name) in propDocs" :id="kebab(name)" :key="name">
      <h2>
        <code>{{ kebab(name) }}</code>
      </h2>
      <p>{{ info.description }}</p>
      <dl>
        <dt>Type</dt>
        <dd>
          <code>{{ info.type }}</code>
        </dd>
        <dt>Default</dt>
        <dd>
          <code>{{ info.default }}</code>
        </dd>
      </dl>
    </section>
  </div>
  <div v-else class="api-definitions">
    <section
      v-for="(description, name) in kind === 'events' ? eventDocs : slotDocs"
      :id="name"
      :key="name"
    >
      <h2>
        <code>{{ kind === 'slots' ? '#' : '@' }}{{ name }}</code>
      </h2>
      <p>{{ description }}</p>
    </section>
  </div>
</template>
