# A select that works your way

Typed values, flexible rendering, and the familiar simplicity of a select.

## Install

Using npm:

```sh
npm install vue3-selectkit
```

Using pnpm:

```sh
pnpm add vue3-selectkit
```

Using Bun:

```sh
bun add vue3-selectkit
```

Requires Vue 3.5 or newer. JavaScript applications work too; TypeScript adds inferred models, callbacks, events, and slots.

## Your first select

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect } from 'vue3-selectkit'
import 'vue3-selectkit/style.css'

const fruit = ref<string | null>(null)
const fruits = ['Apple', 'Pear', 'Peach']
</script>

<template>
  <VueMultiselect v-model="fruit" :options="fruits" label="Fruit" />
</template>
```

Single selection stores a value or `null`. Add `multiple` and use an array for multiple selection. Search, Select all, group selection, virtual scrolling, and option creation are opt-in. Version 0.2 adds paginated remote loading, automatic saved-value resolution, read-only mode, and tag overflow. See [Advanced features](./advanced-features).

## Make it yours

Start in the [playground](/), configure props, subscribe to events, and try slot presets. Copy a complete Vue component into your project.

Use [value mapping](./value-mapping) to choose what your model stores, and [styling](./styling) to match your application.

## Work with a coding agent

The installed package includes `node_modules/vue3-selectkit/AGENTS.md`, a guide to its typed API, value mapping, slots, async features, styling, forms, and accessibility. Ask your agent to read it before implementing your feature. Agents may not automatically load instructions from dependencies.

You can add this line to your application's own `AGENTS.md`:

```text
When working with vue3-selectkit, read node_modules/vue3-selectkit/AGENTS.md before implementing changes.
```

Use the package's actual installation directory if your package manager or workspace places it elsewhere. The guide is also exposed at the resolvable `vue3-selectkit/AGENTS.md` package subpath.
