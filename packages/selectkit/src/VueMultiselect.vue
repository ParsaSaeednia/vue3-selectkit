<script
  setup
  lang="ts"
  generic="
    T extends string | number | object,
    K extends OptionField<T> | undefined = undefined,
    F = never,
    M extends boolean = false
  "
>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
  type StyleValue,
} from 'vue'
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/vue'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/vue-virtual'
import type {
  ChangeDetail,
  ChangeReason,
  ModelValue,
  OptionField,
  OptionKey,
  OptionSlot,
  SelectMessages,
  SelectPart,
  SelectProps,
  SelectValue,
  SelectionSlot,
  ValueSlot,
} from './types'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
function controlAttrs() {
  const { class: _class, style: _style, ...control } = attrs
  return control
}
const props = withDefaults(defineProps<SelectProps<T, K, F, M>>(), {
  filterable: undefined,
  clearable: true,
  closeOnSelect: undefined,
})
type Value = SelectValue<T, K, F>
type Model = ModelValue<T, K, F, M>
const emit = defineEmits<{
  'update:modelValue': [value: Model]
  change: [value: Model, detail: ChangeDetail<T>]
  search: [query: string]
  open: []
  close: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  create: [option: T]
  'load-error': [error: unknown]
  'create-error': [error: unknown]
}>()
defineSlots<{
  option(props: OptionSlot<T, Value>): unknown
  'single-value'(props: ValueSlot<T, Value>): unknown
  tag(props: ValueSlot<T, Value>): unknown
  selection(props: SelectionSlot<T, Value>): unknown
  'group-label'(props: { label: string }): unknown
  'select-all'(props: {
    checked: boolean
    mixed: boolean
    disabled: boolean
    label: string
  }): unknown
  'create-option'(props: { query: string; loading: boolean }): unknown
  loading(props: { query: string }): unknown
  empty(props: { query: string }): unknown
  'no-results'(props: { query: string }): unknown
  error(props: { error: unknown; retry: () => void; source: 'load' | 'create' }): unknown
  header(props: { query: string; close: () => void }): unknown
  footer(props: { query: string; close: () => void }): unknown
}>()
const generatedId = useId()
const uid = computed(() => props.id ?? `vsk-${generatedId}`)
const root = ref<HTMLElement>()
const control = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const popup = ref<HTMLElement>()
const scrollElement = ref<HTMLElement>()
const availableListHeight = ref<number>()
const searchInput = ref<HTMLInputElement>()
const nativeSelect = ref<HTMLSelectElement>()
const opened = ref(false)
const query = ref('')
const localValue = shallowRef<unknown>(props.multiple ? [] : null)
const value = computed(() => (props.modelValue === undefined ? localValue.value : props.modelValue))
const values = computed<Value[]>(() =>
  props.multiple
    ? Array.isArray(value.value)
      ? value.value
      : []
    : value.value == null
      ? []
      : [value.value as Value],
)
const snapshot = Array.isArray(value.value) ? [...value.value] : value.value
const invalid = ref(false)
const announcement = ref('')
const active = ref(-1)
const loadingRemote = ref(false)
const creating = ref(false)
const loadError = shallowRef<unknown>()
const createError = shallowRef<unknown>()
const remote = shallowRef<readonly T[]>()
const created = shallowRef<T[]>([])
const cache = shallowRef(new Map<OptionKey, T>())
const inheritedDir = ref<'ltr' | 'rtl'>('ltr')
let loadController: AbortController | undefined
let createController: AbortController | undefined
let requestNumber = 0
let timer: ReturnType<typeof setTimeout> | undefined
let alive = true
let focused = false
let formElement: HTMLFormElement | null = null
const objectKeys = new WeakMap<object, number>()
let objectCounter = 0
const messages = computed<SelectMessages>(() => ({
  search: 'Search options...',
  empty: 'No options available',
  noResults: 'No matching options',
  loading: 'Loading options...',
  selectAll: 'Select all',
  selectAllLoaded: 'Select all loaded results',
  clear: 'Clear selection',
  remove: 'Remove',
  create: 'Create',
  retry: 'Retry',
  loadError: 'Could not load options',
  createError: 'Could not create option',
  limit: 'Selection limit reached',
  required: 'Please select an option.',
  ...props.messages,
}))
const c = (part: SelectPart) => [
  `vsk-${part.replace(/[A-Z]/g, (x) => `-${x.toLowerCase()}`)}`,
  props.classes?.[part],
]
const wholeObjects = computed(() => !props.getOptionValue && props.valueKey === undefined)
function keyOf(option: T): OptionKey {
  if (typeof props.optionKey === 'function') return props.optionKey(option)
  if (props.optionKey && option != null)
    return (option as Record<string, OptionKey>)[props.optionKey]
  if (typeof option === 'object' && option !== null) {
    if (!objectKeys.has(option)) {
      objectKeys.set(option, ++objectCounter)
      if (import.meta.env.DEV)
        console.warn(
          '[vue3-selectkit] Object options should provide option-key for stable identity.',
        )
    }
    return `object-${objectKeys.get(option)}`
  }
  return option as OptionKey
}
function labelOf(option: T): string {
  if (props.getOptionLabel) return props.getOptionLabel(option)
  if (props.labelKey) return String((option as Record<string, unknown>)[props.labelKey] ?? '')
  if (option !== null && typeof option === 'object')
    return String((option as Record<string, unknown>).label ?? keyOf(option))
  return String(option)
}
function project(option: T): Value {
  if (props.getOptionValue) return props.getOptionValue(option) as Value
  if (props.valueKey !== undefined)
    return (option as Record<string, unknown>)[props.valueKey as string] as Value
  return option as unknown as Value
}
function disabledOption(option: T) {
  return props.getOptionDisabled
    ? props.getOptionDisabled(option)
    : !!(option && typeof option === 'object' && (option as Record<string, unknown>).disabled)
}
function identity(v: Value): unknown {
  return wholeObjects.value && v !== null && typeof v === 'object' ? keyOf(v as unknown as T) : v
}
const selectedSet = computed(() => new Set(values.value.map(identity)))
function equal(a: Value, b: Value) {
  return props.isValueEqual ? props.isValueEqual(a, b) : Object.is(identity(a), identity(b))
}
function selected(option: T) {
  const v = project(option)
  return props.isValueEqual
    ? values.value.some((x) => equal(x, v))
    : selectedSet.value.has(identity(v))
}
const source = computed(() => {
  const map = new Map<OptionKey, T>()
  for (const o of [...(remote.value ?? props.options ?? []), ...created.value])
    if (!map.has(keyOf(o))) map.set(keyOf(o), o)
  return [...map.values()]
})
watch(
  [() => props.options, source, values],
  () => {
    const map = new Map<OptionKey, T>()
    for (const [key, option] of cache.value) if (selected(option)) map.set(key, option)
    for (const o of props.options ?? []) map.set(keyOf(o), o)
    for (const o of source.value) map.set(keyOf(o), o)
    if (wholeObjects.value)
      for (const v of values.value)
        if (v && typeof v === 'object' && !map.has(keyOf(v as unknown as T)))
          map.set(keyOf(v as unknown as T), v as unknown as T)
    cache.value = map
  },
  { immediate: true },
)
const projectedCache = computed(
  () => new Map([...cache.value.values()].map((o) => [identity(project(o)), o])),
)
const selections = computed(() =>
  values.value.map((v, i) => {
    const option = props.isValueEqual
      ? [...cache.value.values()].find((o) => equal(project(o), v))
      : projectedCache.value.get(identity(v))
    return {
      value: v,
      option,
      label: option === undefined ? String(v) : labelOf(option),
      key: option === undefined ? `unresolved-${i}` : keyOf(option),
    }
  }),
)
const selectedOptions = computed(() =>
  selections.value.flatMap((x) => (x.option === undefined ? [] : [x.option])),
)
const normalized = (s: string) =>
  s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim()
const filtered = computed(() => {
  if (
    props.filterable === false ||
    (props.loadOptions && props.filterable !== true) ||
    !query.value
  )
    return source.value
  return source.value.filter((o) =>
    props.filterOption
      ? props.filterOption(o, query.value)
      : normalized(labelOf(o)).includes(normalized(query.value)),
  )
})
const limit = computed(() => props.maxSelected ?? Infinity)
const atLimit = computed(() => !!props.multiple && values.value.length >= limit.value)
const unavailable = (o: T) => disabledOption(o) || (atLimit.value && !selected(o))
const candidates = computed(() => filtered.value.filter((o) => !disabledOption(o)))
const allChecked = computed(() => candidates.value.length > 0 && candidates.value.every(selected))
const allMixed = computed(() => !allChecked.value && candidates.value.some(selected))
const allDisabled = computed(
  () =>
    !!props.disabled ||
    candidates.value.length === 0 ||
    (!allChecked.value &&
      values.value.length + candidates.value.filter((o) => !selected(o)).length > limit.value),
)
const busy = computed(() => !!props.loading || loadingRemote.value)
const canCreate = computed(
  () =>
    !!props.createOption &&
    !!query.value.trim() &&
    !source.value.some((o) => normalized(labelOf(o)) === normalized(query.value)),
)
type Row =
  | { kind: 'group'; label: string; key: string }
  | { kind: 'option'; option: T; index: number; key: OptionKey }
const rows = computed<Row[]>(() => {
  if (!props.groupBy)
    return filtered.value.map((option, index) => ({
      kind: 'option',
      option,
      index,
      key: keyOf(option),
    }))
  const groups = new Map<string, { option: T; index: number }[]>()
  filtered.value.forEach((option, index) => {
    const label =
      typeof props.groupBy === 'function'
        ? props.groupBy(option)
        : String((option as Record<string, unknown>)[props.groupBy as string] ?? '')
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push({ option, index })
  })
  return [...groups].flatMap(([label, items]) => [
    { kind: 'group', label, key: `group-${label}` } as Row,
    ...items.map(({ option, index }) => ({
      kind: 'option' as const,
      option,
      index,
      key: keyOf(option),
    })),
  ])
})
const navigable = computed(() =>
  rows.value.flatMap((r) => (r.kind === 'option' && !unavailable(r.option) ? [r.index] : [])),
)
const activeRow = computed(() =>
  rows.value.findIndex((r) => r.kind === 'option' && r.index === active.value),
)
const virtualizer = useVirtualizer(
  computed(() => ({
    enabled: !!props.virtual && opened.value,
    count: rows.value.length,
    getScrollElement: () => scrollElement.value ?? null,
    estimateSize: (index: number) =>
      rows.value[index]?.kind === 'group' ? 28 : (props.estimateOptionHeight ?? 36),
    getItemKey: (index: number) => `${rows.value[index]?.kind}-${rows.value[index]?.key}`,
    overscan: 5,
    rangeExtractor: (range: Parameters<typeof defaultRangeExtractor>[0]) =>
      [
        ...new Set([
          ...defaultRangeExtractor(range),
          ...(activeRow.value >= 0 ? [activeRow.value] : []),
        ]),
      ].sort((a, b) => a - b),
  })),
)
const renderedRows = computed(() =>
  props.virtual
    ? virtualizer.value.getVirtualItems().map((v) => ({ row: rows.value[v.index]!, virtual: v }))
    : rows.value.map((row) => ({ row, virtual: undefined })),
)
function measure(el: unknown) {
  if (el instanceof HTMLElement && props.virtual) virtualizer.value.measureElement(el)
}
const { floatingStyles } = useFloating(control, popup, {
  placement: computed(() => (props.placement === 'top' ? 'top-start' : 'bottom-start')),
  strategy: computed(() => (props.teleport ? 'fixed' : 'absolute')),
  whileElementsMounted: autoUpdate,
  middleware: computed(() => [
    offset(4),
    ...(props.placement === 'auto' || !props.placement ? [flip()] : []),
    shift({ padding: 8 }),
    size({
      apply({ rects, elements, availableHeight }) {
        const chrome = elements.floating.offsetHeight - (scrollElement.value?.offsetHeight ?? 0)
        availableListHeight.value = Math.max(40, availableHeight - chrome)
        elements.floating.style.width = `${rects.reference.width}px`
      },
    }),
  ]),
})
function commit(next: Value[], reason: ChangeReason, options: T[]) {
  const model = (props.multiple ? [...next] : (next[0] ?? null)) as Model
  localValue.value = model
  invalid.value = false
  emit('update:modelValue', model)
  emit('change', model, { reason, options })
  announcement.value = next.length ? `${next.length} selected` : messages.value.clear
}
function remove(v: Value) {
  if (!props.disabled)
    commit(
      values.value.filter((x) => !equal(x, v)),
      'deselect',
      selections.value
        .filter((x) => equal(x.value, v))
        .flatMap((x) => (x.option === undefined ? [] : [x.option])),
    )
}
function clear() {
  if (!props.disabled && values.value.length) commit([], 'clear', [...selectedOptions.value])
}
function toggle(option: T) {
  if (props.disabled || unavailable(option)) return
  if (props.multiple && selected(option)) remove(project(option))
  else
    commit(props.multiple ? [...values.value, project(option)] : [project(option)], 'select', [
      option,
    ])
  if (props.closeOnSelect ?? !props.multiple) close(true)
}
function toggleAll() {
  if (allDisabled.value) return
  const targets = candidates.value
  const targetIds = new Set(targets.map((o) => identity(project(o))))
  commit(
    allChecked.value
      ? values.value.filter((v) =>
          props.isValueEqual
            ? !targets.some((o) => equal(v, project(o)))
            : !targetIds.has(identity(v)),
        )
      : [...values.value, ...targets.filter((o) => !selected(o)).map(project)],
    allChecked.value ? 'deselect-all' : 'select-all',
    [...targets],
  )
}
async function fetchOptions() {
  if (!props.loadOptions || props.disabled) return
  loadController?.abort()
  const number = ++requestNumber
  loadError.value = undefined
  if (query.value.length < (props.minSearchLength ?? 0)) {
    loadingRemote.value = false
    remote.value = []
    return
  }
  const controller = new AbortController()
  loadController = controller
  loadingRemote.value = true
  loadError.value = undefined
  try {
    const result = await props.loadOptions(query.value, { signal: controller.signal })
    if (alive && number === requestNumber && !controller.signal.aborted) remote.value = result
  } catch (error) {
    if (alive && number === requestNumber && !controller.signal.aborted) {
      loadError.value = error
      emit('load-error', error)
    }
  } finally {
    if (alive && number === requestNumber) loadingRemote.value = false
  }
}
watch(
  () => props.loadOptions,
  (loader) => {
    clearTimeout(timer)
    loadController?.abort()
    ++requestNumber
    remote.value = undefined
    loadError.value = undefined
    loadingRemote.value = false
    if (opened.value && loader) void fetchOptions()
  },
)
watch(query, (q) => {
  emit('search', q)
  active.value = -1
  createError.value = undefined
  clearTimeout(timer)
  loadController?.abort()
  ++requestNumber
  loadingRemote.value = false
  if (opened.value && props.loadOptions) timer = setTimeout(fetchOptions, props.debounce ?? 250)
})
watch(filtered, () => {
  if (!navigable.value.includes(active.value)) active.value = navigable.value[0] ?? -1
})
async function create() {
  if (!props.createOption || !canCreate.value || creating.value || props.disabled || atLimit.value)
    return
  const input = query.value.trim()
  const controller = new AbortController()
  createController = controller
  creating.value = true
  createError.value = undefined
  try {
    const option = await props.createOption(input, { signal: controller.signal })
    if (!alive || controller.signal.aborted || props.disabled) return
    if (atLimit.value) throw new Error(messages.value.limit)
    if (
      cache.value.has(keyOf(option)) ||
      [...cache.value.values()].some((o) => equal(project(o), project(option)))
    )
      throw new Error('Created option must have a unique key and value.')
    created.value = [...created.value, option]
    commit(props.multiple ? [...values.value, project(option)] : [project(option)], 'create', [
      option,
    ])
    emit('create', option)
    searchInput.value?.focus()
    query.value = ''
    if (props.closeOnSelect ?? !props.multiple) close(true)
  } catch (error) {
    if (alive && !controller.signal.aborted) {
      createError.value = error
      emit('create-error', error)
    }
  } finally {
    if (alive) creating.value = false
  }
}
async function open() {
  if (props.disabled || opened.value) return
  inheritedDir.value =
    root.value && getComputedStyle(root.value).direction === 'rtl' ? 'rtl' : 'ltr'
  opened.value = true
  emit('open')
  active.value =
    navigable.value.find((i) => selected(filtered.value[i]!)) ?? navigable.value[0] ?? -1
  if (props.loadOptions) void fetchOptions()
  await nextTick()
  if (props.searchable) searchInput.value?.focus()
  scrollActive()
}
function close(restore = false) {
  if (!opened.value) return
  opened.value = false
  clearTimeout(timer)
  loadController?.abort()
  ++requestNumber
  loadingRemote.value = false
  emit('close')
  if (restore) {
    suppressFocusOpen = true
    trigger.value?.focus()
    queueMicrotask(() => {
      suppressFocusOpen = false
    })
  }
}
let suppressFocusOpen = false
function focus() {
  trigger.value?.focus()
}
function blur() {
  trigger.value?.blur()
  searchInput.value?.blur()
  close()
}
function scrollActive() {
  void nextTick(() => {
    if (props.virtual && activeRow.value >= 0)
      virtualizer.value.scrollToIndex(activeRow.value, { align: 'auto' })
    else
      popup.value
        ?.querySelector(`[data-option-index="${active.value}"]`)
        ?.scrollIntoView?.({ block: 'nearest' })
  })
}
function move(delta: number) {
  const list = navigable.value
  if (!list.length) {
    active.value = -1
    return
  }
  const current = list.indexOf(active.value)
  active.value =
    list[
      Math.max(
        0,
        Math.min(
          list.length - 1,
          current < 0 ? (delta < 0 ? list.length - 1 : 0) : current + delta,
        ),
      )
    ]!
  scrollActive()
}
let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined
function keydown(event: KeyboardEvent) {
  if (props.disabled || event.isComposing) return
  if (
    event.target !== trigger.value &&
    event.target !== searchInput.value &&
    event.key !== 'Escape'
  )
    return
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault()
    if (!opened.value) void open()
    else move(event.key === 'ArrowDown' ? 1 : -1)
  } else if (
    opened.value &&
    ['Home', 'End'].includes(event.key) &&
    (!props.searchable || event.ctrlKey)
  ) {
    event.preventDefault()
    active.value =
      event.key === 'Home' ? (navigable.value[0] ?? -1) : (navigable.value.at(-1) ?? -1)
    scrollActive()
  } else if (event.key === 'Enter' || (event.key === ' ' && event.target !== searchInput.value)) {
    event.preventDefault()
    if (!opened.value) void open()
    else if (active.value >= 0) toggle(filtered.value[active.value]!)
    else if (canCreate.value) void create()
  } else if (event.key === 'Escape' && opened.value) {
    event.preventDefault()
    event.stopPropagation()
    close(true)
  } else if (!props.searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    typeahead += event.key
    clearTimeout(typeaheadTimer)
    typeaheadTimer = setTimeout(() => {
      typeahead = ''
    }, 600)
    void open()
    const match = filtered.value.findIndex(
      (o) => !unavailable(o) && normalized(labelOf(o)).startsWith(normalized(typeahead)),
    )
    if (match >= 0) {
      active.value = match
      scrollActive()
    }
  } else if (
    props.searchable &&
    event.target === trigger.value &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    event.preventDefault()
    query.value = event.key
    void open()
  }
}
function controlClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('button,a,input,select,textarea,[role=button]')) return
  if (opened.value) close()
  else void open()
}
function onFocus(event: FocusEvent) {
  if (!focused) {
    focused = true
    emit('focus', event)
  }
  if (props.openOnFocus && !suppressFocusOpen) void open()
}
function onBlur(event: FocusEvent) {
  const related = event.relatedTarget as Node | null
  if (related && (root.value?.contains(related) || popup.value?.contains(related))) return
  if (focused) {
    focused = false
    emit('blur', event)
  }
  close()
}
function outside(event: PointerEvent) {
  const target = event.target as Node
  if (!root.value?.contains(target) && !popup.value?.contains(target)) close()
}
function reset(event: Event) {
  queueMicrotask(() => {
    if (event.defaultPrevented || !alive) return
    commit(
      (props.multiple
        ? Array.isArray(snapshot)
          ? [...snapshot]
          : []
        : snapshot == null
          ? []
          : [snapshot]) as Value[],
      'reset',
      [],
    )
    query.value = ''
    close()
  })
}
function formValue(v: Value, option: T | undefined): string {
  return props.serializeValue
    ? props.serializeValue(v, option)
    : String(v !== null && typeof v === 'object' && option !== undefined ? keyOf(option) : v)
}
function invalidForm(event: Event) {
  event.preventDefault()
  invalid.value = true
  announcement.value = messages.value.required
  focus()
}
watch(
  () => props.disabled,
  (d) => {
    if (d) {
      close()
      createController?.abort()
      creating.value = false
    }
  },
)
watch(values, () => {
  if (values.value.length) invalid.value = false
})
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  formElement = nativeSelect.value?.form ?? null
  formElement?.addEventListener('reset', reset)
})
onBeforeUnmount(() => {
  alive = false
  clearTimeout(timer)
  clearTimeout(typeaheadTimer)
  loadController?.abort()
  createController?.abort()
  document.removeEventListener('pointerdown', outside)
  formElement?.removeEventListener('reset', reset)
})
defineExpose({ focus, blur, open, close, clear })
</script>

<template>
  <div
    ref="root"
    :class="[c('root'), $attrs.class]"
    :style="$attrs.style as StyleValue"
    :dir="dir"
    :data-unstyled="!!unstyled"
    :data-disabled="!!disabled"
    @focusin="onFocus"
    @focusout="onBlur"
  >
    <label v-if="label" :id="`${uid}-label`" :for="uid" class="vsk-label">{{ label }}</label>
    <div
      ref="control"
      :class="c('control')"
      :data-invalid="invalid"
      :data-open="opened"
      @click="controlClick"
    >
      <div :class="c('selection')">
        <slot
          name="selection"
          :options="selectedOptions"
          :values="values"
          :remove="remove"
          :clear="clear"
          :disabled="!!disabled"
        >
          <template v-if="multiple && selections.length">
            <span v-for="s in selections" :key="s.key" :class="c('tag')">
              <slot
                v-if="s.option !== undefined"
                name="tag"
                :option="s.option"
                :value="s.value"
                :label="s.label"
                :disabled="!!disabled"
                :remove="() => remove(s.value)"
                >{{ s.label }}</slot
              >
              <template v-else>{{ s.label }}</template>
              <button
                type="button"
                :disabled="disabled"
                :aria-label="`${messages.remove} ${s.label}`"
                @click.stop="remove(s.value)"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 5 6 6m0-6-6 6" /></svg>
              </button>
            </span>
          </template>
          <template v-else-if="selections[0]">
            <slot
              v-if="selections[0].option !== undefined"
              name="single-value"
              :option="selections[0].option"
              :value="selections[0].value"
              :label="selections[0].label"
              :disabled="!!disabled"
              :remove="clear"
              >{{ selections[0].label }}</slot
            >
            <template v-else>{{ selections[0].label }}</template>
          </template>
          <span v-else class="vsk-placeholder">{{ placeholder ?? 'Select an option' }}</span>
        </slot>
      </div>
      <button
        :id="uid"
        ref="trigger"
        v-bind="controlAttrs()"
        type="button"
        :class="c('trigger')"
        :disabled="disabled"
        :role="searchable && opened ? 'button' : 'combobox'"
        aria-haspopup="listbox"
        :aria-expanded="opened"
        :aria-controls="opened ? `${uid}-listbox` : undefined"
        :aria-activedescendant="
          opened && !searchable && active >= 0 ? `${uid}-option-${active}` : undefined
        "
        :aria-label="
          ariaLabel ?? (!label && !ariaLabelledby ? (placeholder ?? 'Select an option') : undefined)
        "
        :aria-labelledby="ariaLabelledby ?? (label ? `${uid}-label` : undefined)"
        :aria-describedby="ariaDescribedby"
        :aria-required="required"
        :aria-invalid="invalid || undefined"
        @click="opened ? close() : open()"
        @keydown="keydown"
      >
        <span class="vsk-sr-only">{{
          selections.map((s) => s.label).join(', ') || placeholder || 'Select an option'
        }}</span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          :style="{ transform: opened ? 'rotate(180deg)' : undefined }"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      <button
        v-if="clearable !== false && values.length"
        type="button"
        :class="c('clear')"
        :aria-label="messages.clear"
        :disabled="disabled"
        @click.stop="clear"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
      </button>
    </div>
    <select
      v-if="name || required"
      ref="nativeSelect"
      class="vsk-native"
      tabindex="-1"
      aria-hidden="true"
      :name="name"
      :form="form"
      :multiple="!!multiple"
      :required="required"
      :disabled="disabled"
      @invalid="invalidForm"
    >
      <option v-if="!values.length && !multiple" value="" selected></option>
      <option v-for="s in selections" :key="s.key" :value="formValue(s.value, s.option)" selected>
        {{ s.label }}
      </option>
    </select>
    <span class="vsk-sr-only" role="status" aria-live="polite" aria-atomic="true">{{
      announcement
    }}</span>
    <Teleport :to="typeof teleport === 'string' ? teleport : 'body'" :disabled="!teleport">
      <div
        v-if="opened"
        ref="popup"
        :class="c('dropdown')"
        :style="floatingStyles"
        :dir="dir ?? inheritedDir"
        :data-unstyled="!!unstyled"
        @keydown="keydown"
        @focusin="onFocus"
        @focusout="onBlur"
      >
        <slot name="header" :query="query" :close="close" />
        <input
          v-if="searchable"
          ref="searchInput"
          v-model="query"
          type="text"
          :class="c('search')"
          :placeholder="messages.search"
          :aria-label="messages.search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          :aria-controls="`${uid}-listbox`"
          :aria-activedescendant="active >= 0 ? `${uid}-option-${active}` : undefined"
          autocomplete="off"
        />
        <button
          v-if="multiple && showSelectAll"
          type="button"
          role="checkbox"
          :class="c('selectAll')"
          :aria-checked="allMixed ? 'mixed' : allChecked"
          :disabled="allDisabled || busy"
          :title="allDisabled && candidates.length ? messages.limit : undefined"
          @click="toggleAll"
        >
          <slot
            name="select-all"
            :checked="allChecked"
            :mixed="allMixed"
            :disabled="allDisabled"
            :label="
              loadOptions || filterable === false ? messages.selectAllLoaded : messages.selectAll
            "
          >
            <span class="vsk-check" :data-checked="allChecked || allMixed" aria-hidden="true"
              ><svg v-if="allChecked || allMixed" viewBox="0 0 16 16">
                <path :d="allMixed ? 'M4 8h8' : 'm3 8 3 3 7-7'" /></svg></span
            >{{
              loadOptions || filterable === false ? messages.selectAllLoaded : messages.selectAll
            }}
          </slot>
        </button>
        <div v-if="busy" :class="c('state')" role="status">
          <slot name="loading" :query="query">{{ messages.loading }}</slot>
        </div>
        <div v-if="loadError || createError" :class="c('state')" role="alert">
          <slot
            name="error"
            :error="loadError ?? createError"
            :retry="loadError ? fetchOptions : create"
            :source="loadError ? 'load' : 'create'"
            >{{ loadError ? messages.loadError : messages.createError }}
            <button type="button" @click="loadError ? fetchOptions() : create()">
              {{ messages.retry }}
            </button></slot
          >
        </div>
        <div
          ref="scrollElement"
          :id="`${uid}-listbox`"
          :class="c('listbox')"
          role="listbox"
          :aria-label="label ?? ariaLabel ?? placeholder ?? 'Options'"
          :aria-multiselectable="multiple ? true : undefined"
          :aria-busy="busy"
          :style="{ maxHeight: `${Math.min(maxHeight ?? 256, availableListHeight ?? Infinity)}px` }"
        >
          <div
            :style="
              virtual
                ? { height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }
                : undefined
            "
          >
            <template v-for="item in renderedRows" :key="`${item.row.kind}-${item.row.key}`">
              <div
                v-if="item.row.kind === 'group'"
                :ref="measure"
                :data-index="item.virtual?.index"
                :class="c('group')"
                role="presentation"
                :style="
                  item.virtual
                    ? {
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        transform: `translateY(${item.virtual.start}px)`,
                      }
                    : undefined
                "
              >
                <slot name="group-label" :label="item.row.label">{{ item.row.label }}</slot>
              </div>
              <div
                v-else
                :id="`${uid}-option-${item.row.index}`"
                :ref="measure"
                :data-index="item.virtual?.index"
                :data-option-index="item.row.index"
                :class="c('option')"
                role="option"
                :aria-selected="selected(item.row.option)"
                :aria-disabled="unavailable(item.row.option) || undefined"
                :aria-posinset="item.row.index + 1"
                :aria-setsize="filtered.length"
                :data-highlighted="active === item.row.index"
                :data-selected="selected(item.row.option)"
                :style="
                  item.virtual
                    ? {
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        transform: `translateY(${item.virtual.start}px)`,
                      }
                    : undefined
                "
                @pointermove="!unavailable(item.row.option) && (active = item.row.index)"
                @pointerdown.prevent
                @click="toggle(item.row.option)"
              >
                <slot
                  name="option"
                  :option="item.row.option"
                  :value="project(item.row.option)"
                  :label="labelOf(item.row.option)"
                  :selected="selected(item.row.option)"
                  :highlighted="active === item.row.index"
                  :disabled="unavailable(item.row.option)"
                >
                  <span
                    v-if="multiple"
                    class="vsk-check"
                    :data-checked="selected(item.row.option)"
                    aria-hidden="true"
                    ><svg v-if="selected(item.row.option)" viewBox="0 0 16 16">
                      <path d="m3 8 3 3 7-7" /></svg></span
                  >{{ labelOf(item.row.option) }}
                </slot>
              </div>
            </template>
          </div>
        </div>
        <div v-if="!filtered.length && !busy && !loadError" :class="c('state')">
          <slot v-if="query" name="no-results" :query="query">{{ messages.noResults }}</slot
          ><slot v-else name="empty" :query="query">{{ messages.empty }}</slot>
        </div>
        <button
          v-if="canCreate"
          type="button"
          :class="c('create')"
          :disabled="creating || atLimit || disabled"
          @click="create"
        >
          <slot name="create-option" :query="query" :loading="creating">{{
            creating ? messages.loading : `${messages.create} “${query.trim()}”`
          }}</slot>
        </button>
        <div v-if="$slots.footer" :class="c('footer')">
          <slot name="footer" :query="query" :close="close" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
