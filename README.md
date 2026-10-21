# vue3-selectkit

A typed, accessible Vue 3 select that works your way. Start with an options array, then add search, multiple selection, custom slots, remote loading, creation, or virtualization.

[Documentation & playground](https://parsasaeednia.github.io/vue3-selectkit/) · [API](https://parsasaeednia.github.io/vue3-selectkit/api/props) · [GitHub](https://github.com/ParsaSaeednia/vue3-selectkit)

```sh
npm install vue3-selectkit
```

Requires Vue 3.5+. ESM with TypeScript declarations; no CSS framework required.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect } from 'vue3-selectkit'
import 'vue3-selectkit/style.css'

const frameworks = [
  { id: 1, name: 'Vue' },
  { id: 2, name: 'Svelte' },
  { id: 3, name: 'React' },
]
const selected = ref<number[]>([])
</script>

<template>
  <VueMultiselect
    v-model="selected"
    :options="frameworks"
    option-key="id"
    label-key="name"
    value-key="id"
    label="Frameworks"
    multiple
    searchable
    show-select-all
  />
</template>
```

Omit `value-key` to keep whole option objects. Use a scalar or `null` in single mode and an array with `multiple`. Primitive arrays need no key or label configuration. Keys and projected values must uniquely identify options.

## Features

- Typed models, callbacks, events and slots; immutable controlled values.
- Single/multiple selection, local search, grouping, disabled options and selection limits.
- Optional Select all for enabled matching **loaded** options, independent of virtual rows.
- Custom value projections and comparison; selected display independent of stored values.
- Debounced remote loading with AbortSignal, stale-response protection and retryable errors.
- Typed synchronous/asynchronous creation callbacks; your application owns persistence.
- Measured virtual scrolling powered by TanStack Virtual.
- RTL, keyboard navigation, accessible labels and native form submission/reset.
- CSS variables, part classes, unstyled mode and typed rendering slots.

## Custom rendering

```vue
<template #single-value="{ option }">
  <strong>{{ option.name }}</strong>
</template>
```

Place the slot inside `VueMultiselect`. Use `#selection` to replace the complete selected display or `#tag` to customize individual chips.

## Change events

`@change="(value, { reason, options }) => ..."` receives the mapped model and affected options. Bulk operations emit one change. External model updates do not echo change events.

## Development

```sh
npm ci
npm run build:lib
npm run dev
npm run release:check
npx playwright install chromium
npm run test:e2e
```

The workspace contains the publishable library and VitePress docs. The playground generates complete Vue SFCs, checked against the published declarations. `check:package` installs the packed tarball into a clean application and builds it.

MIT © Parsa Saeednia
