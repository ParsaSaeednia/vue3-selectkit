# Use with Nuxt

vue3-selectkit supports Nuxt 3 and Nuxt 4 with Vue 3.5 or newer. The package is tested in production builds of Nuxt 3.21.11 and 4.6.4, including server rendering, hydration, TypeScript and browser interactions. Nuxt 2 is unsupported.

Use version **0.2.1 or newer**. It fixes the bare `multiple` attribute in compiled Vue templates. On 0.2.0, `:multiple="true"` is a temporary workaround; upgrading lets you use the normal `multiple` shorthand.

## Install

Choose your package manager:

```sh
npm install vue3-selectkit
```

```sh
pnpm add vue3-selectkit
```

```sh
bun add vue3-selectkit
```

## Load the stylesheet

Add the package stylesheet to your Nuxt configuration so it is available during server rendering and on every page:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['vue3-selectkit/style.css'],
})
```

## Import the component

In the default Nuxt 4 structure, put this in `app/app.vue` or a page under `app/pages/`. In Nuxt 3, use the root `app.vue` or a page under `pages/`. Adjust those paths if your project customizes `srcDir`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect } from 'vue3-selectkit'

const people = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]
const selectedIds = ref<number[]>([1])
</script>

<template>
  <VueMultiselect
    v-model="selectedIds"
    :options="people"
    option-key="id"
    label-key="name"
    value-key="id"
    label="People"
    multiple
    searchable
    show-select-all
    teleport="#teleports"
  />
</template>
```

Import `VueMultiselect` explicitly. The package does not currently ship a Nuxt module or configure automatic component imports. A `<ClientOnly>` wrapper, client-only plugin or extra `build.transpile` entry is not required in the tested configurations.

## Boolean props and model shape

`multiple` and `:multiple="true"` both enable array models. Omitting the prop or passing `:multiple="false"` uses a scalar or `null`. For a dynamic `:multiple="isMultiple"`, keep your model consistent with the current mode: an array when true, a scalar or `null` when false. Use a bound boolean when disabling the prop; the string `multiple="false"` is not a false boolean.

## Server rendering and remote data

Seed `options` with selected records when their labels should appear in the initial server HTML. Fetching those records with Nuxt's `useAsyncData` and passing the same serialized data to the component preserves matching initial state during hydration.

`resolve-options(values, { signal })` resolves missing selected records after mounting; `load-options(query, { signal, cursor })` runs when opening or searching on the client. With only IDs available during server rendering, those IDs are shown until their records resolve. Both callbacks support cancellation; your application owns the HTTP calls.

The [advanced guide](./advanced-features) covers pagination, creation, compact tags, group actions and read-only mode. Those features are included in the Nuxt integration checks.

## Teleported dropdowns

Omit `teleport` to keep the dropdown inside the component. When teleporting in Nuxt, use `teleport="#teleports"`, following [Nuxt's supported SSR teleport target](https://nuxt.com/docs/4.x/api/components/teleports). For other targets, follow Nuxt's `<ClientOnly>` guidance and ensure the target exists before opening.

## Compatibility checks

The repository's `npm run test:nuxt` command installs the packed library into separate Nuxt 3 and Nuxt 4 applications. It checks labels in the server HTML before JavaScript runs, then checks hydration IDs, array/scalar models, native forms, keyboard selection, groups, overflow, read-only behavior, remote loading, creation and `#teleports`. Type checking and production builds run for both versions. Both jobs must pass before the documentation site deploys.
