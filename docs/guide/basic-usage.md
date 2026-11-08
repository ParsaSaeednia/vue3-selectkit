# Familiar by default

Start small. Turn on the features your application needs.

## Single or multiple

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect } from 'vue3-selectkit'
import 'vue3-selectkit/style.css'
const selected = ref<string[]>([])
const options = ['Vue', 'React', 'Svelte']
</script>
<template>
  <VueMultiselect
    v-model="selected"
    :options="options"
    multiple
    searchable
    show-select-all
    label="Frameworks"
  />
</template>
```

The dropdown closes after single selection and stays open for multiple selection. Override `close-on-select` or enable `open-on-focus`. `clearable` defaults to true.

## Search and Select all

Search is case- and diacritic-insensitive. Use `filter-option` for a custom local predicate. Set `filterable="false"` with `v-bind` when the application already filters results.

`show-select-all` adds the top checkbox in multiple mode. It toggles all enabled matching options in the loaded list, including rows outside a virtual viewport, and preserves selections outside the current search. A partial selection shows a mixed checkbox.

With remote options, Select all means **loaded results**. It does not select records that the API has not returned.

## Disabled options, groups, limits

Object options support a `disabled` field, or provide `get-option-disabled`. Group with `group-by="category"` or a callback. Use `max-selected` to cap multiple selection; bulk selection is disabled when it would exceed the cap.

## Change events

`@change="(value, detail) => ..."` receives the complete mapped model and `{ reason, options }`. A bulk action emits one change. Updating your model externally does not emit another change event.

## Focus and opening

Component refs expose `focus()`, `blur()`, `open()`, `close()`, and `clear()`. For generic refs use the exported `SelectExposed` interface. Disabled controls do not open or change their selection.

## Read-only, compact tags and groups

`readonly` permits focusing, opening and searching, and preserves native submission. Selection changes, clear, remove, creation and bulk actions are blocked. Custom rendering slots receive `disabled: true` and should honor it. External model updates and form reset remain supported.

For multiple values, `:max-visible-tags="3"` shows up to three tags followed by a summary. Zero shows only the summary. It changes presentation, not the stored or submitted values. `#tag-overflow` receives the hidden `count`, resolved `options` and all hidden `values`.

Combine `multiple`, `group-by` and `show-group-select` for group-level actions above the listbox. They honor the search, disabled options and selection limits, and preserve selections outside the target group. Each action emits one change with reason `select-group` or `deselect-group`.
