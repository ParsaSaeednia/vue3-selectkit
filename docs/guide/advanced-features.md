# More control, less wiring

Version 0.2 adds paged results, saved-value resolution, compact tags, read-only mode and group actions. Existing array loaders and selection defaults keep working.

## Cursor pagination

Return `{ options, nextCursor }` from `load-options`. The first request has an undefined cursor. Subsequent requests receive your previous `nextCursor`; omit it or return `null` to finish. String and number cursors are supported, including `0`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect, type LoadOptionsContext, type OptionsPage } from 'vue3-selectkit'
import 'vue3-selectkit/style.css'

interface Person {
  id: number
  name: string
  team: string
}
const selected = ref<number[]>([42])

async function loadPeople(
  query: string,
  { signal, cursor }: LoadOptionsContext,
): Promise<OptionsPage<Person>> {
  const params = new URLSearchParams({ query })
  if (cursor !== undefined) params.set('cursor', String(cursor))
  const response = await fetch(`/api/people?${params}`, { signal })
  if (!response.ok) throw new Error('Could not load people')
  return response.json()
}

async function resolvePeople(
  ids: readonly number[],
  { signal }: { signal: AbortSignal },
): Promise<Person[]> {
  const response = await fetch(`/api/people/by-ids?ids=${encodeURIComponent(ids.join(','))}`, {
    signal,
  })
  if (!response.ok) throw new Error('Could not resolve people')
  return response.json()
}
</script>

<template>
  <VueMultiselect
    v-model="selected"
    :load-options="loadPeople"
    :resolve-options="resolvePeople"
    option-key="id"
    label-key="name"
    value-key="id"
    label="People"
    multiple
    searchable
    virtual
    show-select-all
    group-by="team"
    show-group-select
    :max-visible-tags="3"
  />
</template>
```

The server's page response should look like:

```json
{ "options": [{ "id": 42, "name": "Ada", "team": "Research" }], "nextCursor": "page-2" }
```

Scrolling near the end or activating **Load more** appends results. A ref typed with `SelectExposed` also exposes `loadMore()`. Duplicate option keys are displayed once. Query changes cancel the old page sequence. Failed page retries keep previous results and reuse the failing cursor. A repeated cursor ends pagination to prevent a request loop.

Select all and group selection act only on matching enabled **loaded** options, including rows outside the virtual viewport. They never imply that every server record is selected. When a group would exceed `max-selected`, its bulk action is disabled rather than partially selecting it.

## Resolve saved values

`resolve-options(values, { signal })` receives only selected values whose records are missing. It runs after mounting, before opening, and when the model or available options change. Its return value supplies labels and slot data without changing `v-model` or adding unrelated options to search results.

The resolver's values follow `value-key` or `get-option-value`; in the example above they are numbers. If no record is returned for a value, its raw value remains visible. Stale and aborted results are ignored. Seeding `options` manually still works and avoids resolving those records.

## Compact tags

Set `:max-visible-tags="3"` to show three tags and a summary. Use zero to show just the summary; omit the prop for unlimited tags. Selection, FormData and bulk operations retain every value.

```vue
<template #tag-overflow="{ count, values }">
  <span :title="values.join(', ')">{{ count }} more people</span>
</template>
```

The slot receives the hidden `count`, all hidden `values`, and the hidden resolved `options`. The default summary uses `messages.moreSelected(count)`.

## Read-only selection

`readonly` keeps the control focusable and allows opening, searching, copying text and native form submission. It blocks selection changes, tag removal, clear, creation, and group/global bulk actions. External model updates and form reset still work. Use `disabled` when focus and submission should also be disabled.

Custom selection, tag and option slots receive `disabled: true` when read-only; preserve that state in custom controls.

## Group actions

Combine `multiple`, `group-by` and `show-group-select`. Checkbox buttons above the listbox expose checked, mixed and disabled states. They preserve selections outside their group and honor the current search and selection limit.

Each group action emits one `change` with reason `select-group` or `deselect-group`. Customize its contents with `#group-select="{ label, checked, mixed, disabled }"`. Translate its accessible name using `messages.selectGroup(label)`.

## Errors and translation

The error slot receives `{ error, retry, source }`, where `source` is `load`, `create` or `resolve`. Built-in Retry works without a custom slot. Events `load-error`, `create-error` and `resolve-error` receive an unknown error; aborted requests emit none.

Count messages are functions so applications can use their own pluralization rules:

```ts
const messages = {
  selectedCount: (count: number) => `${count} انتخاب شده`,
  moreSelected: (count: number) => `+${count} مورد دیگر`,
  selectGroup: (label: string) => `انتخاب گروه ${label}`,
  loadMore: 'بارگذاری بیشتر',
  resolveError: 'دریافت گزینه‌های انتخاب‌شده ناموفق بود',
}
```

Additional string keys are `placeholder`, `options`, `groups` and `duplicate`. All previous message keys remain available. New styling parts are `groupSelect`, `tagOverflow` and `loadMore`.
