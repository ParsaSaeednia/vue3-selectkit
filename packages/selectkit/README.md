# vue3-selectkit

A typed, accessible Vue 3 select that works your way. Start with an options array, then add search, multiple selection, custom slots, remote loading, creation, or virtualization.

[Documentation & playground](https://parsasaeednia.github.io/vue3-selectkit/) · [API](https://parsasaeednia.github.io/vue3-selectkit/api/props) · [GitHub](https://github.com/ParsaSaeednia/vue3-selectkit)

```sh
# npm
npm install vue3-selectkit

# pnpm
pnpm add vue3-selectkit

# Bun
bun add vue3-selectkit
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
- Debounced remote loading with AbortSignal, stale-response protection, cursor pagination, infinite scrolling and retryable errors.
- Automatic resolution of saved IDs through `resolve-options`, without seeding option records.
- Read-only mode, group-level bulk actions, and configurable tag overflow.
- Typed synchronous/asynchronous creation callbacks; your application owns persistence.
- Measured virtual scrolling powered by TanStack Virtual.
- RTL, keyboard navigation, accessible labels and native form submission/reset.
- CSS variables, part classes, unstyled mode and typed rendering slots.

## Nuxt 3 and 4

Use Vue 3.5+ and vue3-selectkit 0.2.1+. Add `css: ['vue3-selectkit/style.css']` to `nuxt.config.ts` and import `VueMultiselect` explicitly in your Vue component. Nuxt 4 uses `app/app.vue` by default; Nuxt 3 uses the root `app.vue`. No client-only wrapper or extra transpilation is required in the tested configurations. For a teleported dropdown, use `teleport="#teleports"`.

The normal `multiple` shorthand works in 0.2.1; `:multiple="true"` remains valid. On 0.2.0, use the explicit boolean binding until upgrading. Omitting the prop or using `:multiple="false"` keeps a scalar model.

Production SSR, hydration, type checking and browser interactions are checked against Nuxt 3.21.11 and 4.6.4 using the packed library. See the [Nuxt setup guide](https://parsasaeednia.github.io/vue3-selectkit/guide/nuxt) for complete instructions, remote data and SSR details. Nuxt 2 is unsupported.

## New in 0.2

- `load-options` still accepts a plain options array. Return `{ options, nextCursor }` to load pages; the next request receives `context.cursor`. Scrolling near the end or the keyboard-accessible **Load more** button appends the next page. Omit `nextCursor` or return `null` at the end.
- `resolve-options(values, { signal })` fetches records for missing selected values automatically, before opening. Return option records; the stored values remain unchanged. Use `value-key` or `get-option-value` to map saved IDs.
- `max-visible-tags` is a number prop: use `:max-visible-tags="3"` to show three tags plus a localized “+N more” summary. Every value still submits. Customize with `#tag-overflow`.
- `readonly` keeps focus, search and native submission while blocking selection, clearing, removal and creation. Rendering slots receive `disabled: true` in read-only mode.
- `show-group-select` works with `multiple` and `group-by`, toggling enabled matching **loaded** options within each group while respecting `max-selected`.
- Translate counts with `messages.selectedCount(count)` and `messages.moreSelected(count)`; group action labels use `messages.selectGroup(label)`.

See the [advanced guide](https://parsasaeednia.github.io/vue3-selectkit/guide/advanced-features) for complete examples, error handling and API details. The [playground](https://parsasaeednia.github.io/vue3-selectkit/) generates code for all five features.

## Custom rendering

```vue
<template #single-value="{ option }">
  <strong>{{ option.name }}</strong>
</template>
```

Place the slot inside `VueMultiselect`. Use `#selection` to replace the complete selected display or `#tag` to customize individual chips.

## Change events

`@change="(value, { reason, options }) => ..."` receives the mapped model and affected options. Bulk operations emit one change. External model updates do not echo change events.

## Using with coding agents

The npm package includes a [consumer agent guide](./AGENTS.md) at `node_modules/vue3-selectkit/AGENTS.md`. It explains typed models, value mapping, events, slots, remote loading, creation, styling, forms, and accessibility.

Agents may not discover instructions inside dependencies automatically. Ask your agent to read the file, or add this line to your application's `AGENTS.md`:

```text
When working with vue3-selectkit, read node_modules/vue3-selectkit/AGENTS.md before implementing changes.
```

For a different installation layout, point the agent to `AGENTS.md` in the resolved package directory. The public `vue3-selectkit/AGENTS.md` subpath can also be resolved by Node tooling.

## Development

```sh
npm ci
npm run build:lib
npm run dev
npm run release:check
npx playwright install chromium firefox webkit
npm run test:e2e
```

The workspace contains the publishable library and VitePress docs. The playground generates complete Vue SFCs, checked against the published declarations. `check:package` installs the packed tarball into a clean application and builds it.

MIT © Parsa Saeednia
