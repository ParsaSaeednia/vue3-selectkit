# Using vue3-selectkit in a Vue application

This guide is for coding agents implementing features with the installed package. Follow the consuming project's instructions and conventions. Make application changes in that project; treat this installed package as a reference.

## Find the right API

- Requires Vue 3.5+; use Vue 3 Composition API and TypeScript when the application supports them.
- Import the named `VueMultiselect` export from `vue3-selectkit`. Import `vue3-selectkit/style.css` once, before application overrides.
- The installed `dist/types.d.ts` and `dist/VueMultiselect.vue.d.ts` describe the exact version's props, events, slots and exposed methods. Check them before introducing an unfamiliar API; do not substitute APIs from similarly named multiselect packages.
- Docs and interactive SFC generator: https://parsasaeednia.github.io/vue3-selectkit/
- API: https://parsasaeednia.github.io/vue3-selectkit/api/props, https://parsasaeednia.github.io/vue3-selectkit/api/events, https://parsasaeednia.github.io/vue3-selectkit/api/slots

## Start with the user's desired stored value

- Single mode is the default. Initialize `v-model` with a value or `null`.
- Add `multiple` and initialize `v-model` with an array for multiple selection.
- Options may be strings, numbers or objects. Primitive options need no keys or label configuration.
- For objects, supply a stable `option-key="id"` and a `label-key="name"`, or typed callbacks. Keys must uniquely identify options.
- Whole objects are stored by default. `value-key="id"` stores the option's ID. `get-option-value` takes precedence over `value-key` and supports a custom projection; projected values must also uniquely identify options.
- Give projection callbacks a named typed function or an explicitly typed inline parameter so TypeScript can infer the model. Use `is-value-equal` when projected objects need comparison by contents.
- Option labels and rendering slots control presentation independently of the stored model. Do not change the mapping just to change what the selected state looks like.
- Treat options and model arrays as immutable; replace application state rather than mutating package internals.

## Complete example: searchable multiple IDs with custom tags

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect, type ChangeDetail } from 'vue3-selectkit'
import 'vue3-selectkit/style.css'

interface Person {
  id: number
  name: string
  email: string
  disabled?: boolean
}

const people: Person[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
]
const selectedIds = ref<number[]>([])

function onChange(value: number[], detail: ChangeDetail<Person>) {
  console.log(value, detail.reason, detail.options)
}
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
    @change="onChange"
  >
    <template #tag="{ option }">
      <span>{{ option.name }} ({{ option.email }})</span>
    </template>
  </VueMultiselect>
</template>
```

For a single ID, remove `multiple`, use `ref<number | null>(null)` and adjust the handler's value type. For whole objects, remove `value-key` and use `Person | null` or `Person[]`.

## Choose the relevant behavior

- Search is opt-in with `searchable`. Local filtering can be customized with `filter-option` or disabled with `:filterable="false"`.
- `show-select-all` works only with `multiple`. It toggles enabled matching options across the complete loaded list, including virtualized rows, and preserves selections outside the search. It does not select unloaded server records. `max-selected` constrains selections and may disable the action.
- Use `readonly` to prevent edits while retaining focus, search and native submission. Custom slots receive `disabled: true` when disabled or read-only.
- Limit displayed chips with `:max-visible-tags="3"`; `#tag-overflow` receives `{ count, options, values }`. This does not limit selected or submitted values.
- Add `show-group-select` with `multiple` and `group-by` for group bulk actions across matching enabled loaded options.
- Group with `group-by`; disable records with `get-option-disabled` or the option's `disabled` field. `disabled` disables the whole control.
- `clearable`, `placeholder`, `open-on-focus`, `close-on-select`, `placement` (`auto`, `top`, `bottom`), `teleport`, and `max-height` control interaction and placement. Single mode closes after selecting by default; multiple mode stays open.
- Enable `virtual` for large lists; `estimate-option-height` is an estimate, and custom rows are measured. Do not implement bulk actions using only mounted DOM rows.
- RTL inherits from the page, or set `dir="rtl"`. Localize strings through `messages`; use CSS logical properties in application styles.

## Remote loading and creation

Use `load-options(query, { signal })` for built-in loading. The first opening loads immediately; later searches debounce by 250 ms by default. `debounce` and `min-search-length` are configurable. Pass the signal to fetch, throw on failed HTTP responses, and return options of the declared type. The component cancels outdated requests and ignores stale responses. It preserves server order without additional local filtering.

Use `resolve-options(values, { signal })` to resolve missing selected records before opening without changing the model. Values have the projected model type; return matching options. Handle `resolve-error` as unknown; the error slot exposes `source: 'resolve'` and `retry`. Seeding `options` remains supported. Selected records remain available when results change. When managing requests externally, supply `options`, `loading`, and `@search`, set `:filterable="false"` for server-filtered results, and implement cancellation/error handling in the application.

`create-option(query, { signal })` returns a typed option synchronously or asynchronously. It adds and selects the result, prevents duplicate creation, and emits `create`; the consuming application owns persistence. Return the server's saved record when persistence must complete before selection. Do not save it again in `@create` if the callback already saved it.

## Events and rendering slots

- `v-model` uses `update:modelValue`. `change(value, detail)` describes selection actions, with mapped values plus `detail.reason` and affected `detail.options`. External model updates do not echo change events. Change reasons are `select`, `deselect`, `clear`, `select-all`, `deselect-all`, `select-group`, `deselect-group`, `create`, and `reset`.
- Other events are `search(query)`, `open()`, `close()`, `focus(event)`, `blur(event)`, `create(option)`, `load-error(error)`, `create-error(error)`, and `resolve-error(error)`. Handle errors as `unknown`. Cancellations do not emit load errors.
- `#option` receives `{ option, value, label, selected, highlighted, disabled }`; keep its content noninteractive so listbox keyboard behavior remains intact.
- `#single-value` and `#tag` receive `{ option, value, label, disabled, remove }`. `#tag` customizes tag contents; the default remove control remains available.
- `#selection` replaces the complete selected display and receives `{ options, values, remove, clear, disabled }`. If adding custom controls, honor `disabled` and provide accessible labels.
- Other slots: `#group-label`, `#select-all`, `#create-option`, `#loading`, `#empty`, `#no-results`, `#error`, `#header`, and `#footer`. Check installed declarations for their exact slot props. The error slot exposes `retry` and a `source` of `load`, `create`, or `resolve`.
- Use a component ref typed with the exported `SelectExposed` type for `focus()`, `blur()`, `open()`, `close()`, `clear()`, and `loadMore()`.

## Styling and forms

- Override CSS variables after importing the package stylesheet. Useful variables: `--vsk-accent`, `--vsk-bg`, `--vsk-text`, `--vsk-muted`, `--vsk-border`, `--vsk-highlight`, `--vsk-radius`, `--vsk-font`, `--vsk-control-height`, `--vsk-option-height`, and `--vsk-shadow`.
- Apply variables to both `.vsk-root` and `.vsk-dropdown`. Teleported dropdowns do not inherit styles from the original component root. Use global overrides or explicit part classes for them; account for Vue scoped-style boundaries.
- `classes` accepts these part keys: `root`, `control`, `selection`, `trigger`, `tag`, `clear`, `dropdown`, `search`, `listbox`, `option`, `group`, `selectAll`, `create`, `state`, and `footer`. For example, `:classes="{ control: 'people-control', dropdown: 'people-dropdown' }"`.
- `unstyled` removes default visual surfaces while retaining structure and accessibility utilities. Supply the application's theme without removing keyboard focus indicators.
- Give every instance a `label`, `aria-label`, or `aria-labelledby`. Preserve keyboard operation and selected/disabled semantics when customizing slots.
- Use `name` for native FormData, `required` for constraint validation, and `form` to associate an external form ID. Multiple values submit repeated entries under the same name. Disabled controls do not submit. Reset restores the selection captured at mount and emits the `reset` change reason.
- Primitive form values serialize as strings; whole-object values use stable option keys. `serialize-value(value, option)` controls form serialization without changing `v-model`. Seed remote option records before mounting when IDs need labels or serialization.

## Before finishing an application change

Run the consuming project's existing type check, build and relevant tests. Exercise the requested selection mode, clearing, keyboard interaction, disabled/required behavior, and any changed async or RTL path. Verify that the model stores the requested shape and that slot customization only changes presentation. Use the installed types and documentation to resolve API uncertainty instead of widening types to `any`.

## Version 0.2 APIs

- Existing array loaders remain supported. For pagination return `{ options, nextCursor }`; `context.cursor` is undefined on the first page and holds the returned cursor on later pages. `LoadOptionsContext` and `OptionsPage<T>` are exported types. Omit or null the next cursor to finish. Scrolling or the accessible Load more button appends pages; retries preserve earlier pages and the failing cursor. Query changes abort/reset the page sequence. Select all and group actions only include loaded options.
- Localize count announcements with `messages.selectedCount(count)`, tag summaries with `messages.moreSelected(count)` and group action names with `messages.selectGroup(label)`. Additional strings: `placeholder`, `options`, `groups`, `loadMore`, `resolveError`, `duplicate`.
- New class parts: `groupSelect`, `tagOverflow`, `loadMore`. New slots: `group-select` (`label`, `checked`, `mixed`, `disabled`) and `tag-overflow` (`count`, `options`, `values`).
- Reset invalidates pending creation; late aborted callbacks cannot update selection or clear a newer request's busy state. Keep honoring AbortSignal in application network requests.

## Nuxt 3 and Nuxt 4

- Requires Vue 3.5+; Nuxt 2 is unsupported. Use vue3-selectkit 0.2.1 or newer, which fixes runtime Boolean casting for the generic `multiple` prop. Normal `multiple` and `:multiple="true"` both store arrays. On 0.2.0, use `:multiple="true"` until upgrading. Omitted or bound-false mode stores a scalar/null; keep dynamic models consistent with the mode.
- Add `css: ['vue3-selectkit/style.css']` to `nuxt.config.ts`. Explicitly import `VueMultiselect`; the package does not ship a Nuxt auto-import module. Default Nuxt 4 entry is `app/app.vue`; Nuxt 3 uses root `app.vue`. Follow project-specific `srcDir` settings.
- The component supports SSR and hydration without a client-only wrapper or a custom transpile entry in the tested Nuxt 3.21.11 and 4.6.4 configurations. Seed selected option records during SSR (for example using `useAsyncData`) when initial HTML must contain their labels. The built-in resolver runs after mounting and loaders run when opening/searching on the client.
- For teleporting, use `teleport="#teleports"`, Nuxt's SSR target. The default keeps the popup in the component. Ensure other targets exist before opening.
- Read the [Nuxt setup guide](https://parsasaeednia.github.io/vue3-selectkit/guide/nuxt) for full instructions. Integration checks install the packed library into real Nuxt apps and cover production SSR, hydration, types and interactions.
