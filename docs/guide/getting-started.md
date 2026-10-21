# A select that works your way

Typed values, flexible rendering, and the familiar simplicity of a select.

## Install

```sh
npm install vue3-selectkit
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

Single selection stores a value or `null`. Add `multiple` and use an array for multiple selection. Search, Select all, virtual scrolling, and option creation are opt-in.

## Make it yours

Start in the [playground](/), configure props, subscribe to events, and try slot presets. Copy a complete Vue component into your project.

Use [value mapping](./value-mapping) to choose what your model stores, and [styling](./styling) to match your application.
