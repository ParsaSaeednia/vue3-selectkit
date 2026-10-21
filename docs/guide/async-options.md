# Search remote options

Choose a built-in loader or manage requests in your application.

## Built-in loading

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect, type AsyncContext } from 'vue3-selectkit'
import 'vue3-selectkit/style.css'
interface User {
  id: number
  name: string
}
const selected = ref<number | null>(null)
async function loadUsers(query: string, { signal }: AsyncContext): Promise<User[]> {
  const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`, { signal })
  if (!response.ok) throw new Error('Could not load users')
  return response.json()
}
</script>
<template>
  <VueMultiselect
    v-model="selected"
    :load-options="loadUsers"
    option-key="id"
    label-key="name"
    value-key="id"
    searchable
    label="User"
  />
</template>
```

The first opening loads immediately. Search requests debounce by 250 ms; configure `debounce` and `min-search-length`. Aborted and stale responses never replace newer results or emit errors. Results retain the API's order without local filtering.

## External loading

Supply `options`, `loading`, and `@search`, and set `:filterable="false"` for server-filtered results. The application owns cancellation and errors in this mode; render error UI in a header or footer slot if needed.

## Selected labels and errors

Seed options for preselected IDs. Selected records remain cached while searching. Customize `#loading` and `#error="{ error, retry }"`; the default error UI includes a retry action. `@load-error` excludes cancellations.

Select all operates on the returned loaded options, not a server's complete dataset. Pagination and persistence remain application responsibilities.
