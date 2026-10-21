<script setup lang="ts">
import {
  computed,
  markRaw,
  nextTick,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
  type Component,
} from 'vue'
import { VueMultiselect } from 'vue3-selectkit'
import type {
  AsyncContext,
  OptionSlot,
  SelectExposed,
  SelectionSlot,
  ValueSlot,
} from 'vue3-selectkit'
import { highlight } from './highlight'
import {
  defaultConfig,
  eventDocs,
  frameworks,
  propDocs,
  type Framework,
  type PlaygroundConfig,
  type PropInfo,
} from './metadata'
import { generateExample } from './generate'
const LiveSelect = markRaw(VueMultiselect as Component)
const config = reactive(defaultConfig())
const tab = ref('Props')
const selected = shallowRef<unknown>([1, 3])
const live = ref<SelectExposed>()
const log = ref<{ name: string; detail: string; time: string }[]>([])
const copied = ref(false)
const highlighted = ref('')
const allOptions = computed<Framework[]>(() =>
  config.virtual
    ? Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Framework ${i + 1}`,
        category: `Group ${i % 5}`,
      }))
    : frameworks,
)
const code = computed(() => generateExample(config))
let highlightRequest = 0
watch(
  code,
  async (value) => {
    const request = ++highlightRequest
    const html = await highlight(value)
    if (request === highlightRequest) highlighted.value = html
  },
  { immediate: true },
)
function moveTab(delta: number) {
  const tabs = ['Props', 'Events', 'Slots']
  tab.value = tabs[(tabs.indexOf(tab.value) + delta + 3) % 3]!
  void nextTick(() => document.getElementById(`tab-${tab.value}`)?.focus())
}
function resetSelection() {
  const o = allOptions.value
  const chosen = [o[0]!, o[2]!].map((x) =>
    config.storedValue === 'id' ? x.id : config.storedValue === 'name' ? x.name : x,
  )
  selected.value = config.multiple ? chosen : chosen[0]
}
watch([() => config.multiple, () => config.storedValue, () => config.virtual], resetSelection)
function record(name: string, ...args: unknown[]) {
  log.value = [
    { name, detail: JSON.stringify(args, null, 2) ?? '', time: new Date().toLocaleTimeString() },
    ...log.value,
  ].slice(0, 20)
}
async function loader(query: string, { signal }: AsyncContext) {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, 350)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
  return allOptions.value.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
}
let nextId = 10000
const createOption = (name: string): Framework => ({ id: ++nextId, name, category: 'Custom' })
const bindings = computed(() => ({
  modelValue: selected.value,
  'onUpdate:modelValue': (value: unknown) => {
    selected.value = value
  },
  options: allOptions.value,
  optionKey: 'id',
  labelKey: 'name',
  label: config.rtl ? 'فریم‌ورک‌ها' : 'Frameworks',
  valueKey: config.storedValue === 'id' ? 'id' : undefined,
  getOptionValue: config.storedValue === 'name' ? (option: Framework) => option.name : undefined,
  multiple: config.multiple,
  searchable: config.searchable,
  showSelectAll: config.showSelectAll,
  disabled: config.disabled,
  loading: config.loading,
  virtual: config.virtual,
  clearable: config.clearable,
  openOnFocus: config.openOnFocus,
  closeOnSelect: config.closeOnSelect,
  teleport: config.teleport,
  placement: config.placement,
  maxHeight: Number(config.maxHeight),
  placeholder: config.placeholder,
  dir: config.rtl ? 'rtl' : undefined,
  unstyled: config.unstyled,
  groupBy: config.groupBy ? 'category' : undefined,
  loadOptions: config.loadOptions ? loader : undefined,
  createOption: config.createOption ? createOption : undefined,
  ...Object.fromEntries(
    config.events.map((name) => [
      `on${name.replace(/(^|-)(\w)/g, (_, _dash, letter: string) => letter.toUpperCase())}`,
      (...args: unknown[]) => record(name, ...args),
    ]),
  ),
}))
const controls = computed(() =>
  Object.entries(propDocs).flatMap(([key, info]) =>
    (info as PropInfo).control
      ? [{ key: key as keyof PlaygroundConfig, ...(info as PropInfo) }]
      : [],
  ),
)
const advancedKeys = [
  'clearable',
  'groupBy',
  'openOnFocus',
  'loadOptions',
  'createOption',
  'teleport',
]
const booleanValue = (key: keyof PlaygroundConfig) => !!config[key]
function toggle(key: keyof PlaygroundConfig) {
  ;(config as Record<string, unknown>)[key] = !config[key]
}
function toggleEvent(name: string) {
  config.events = config.events.includes(name)
    ? config.events.filter((x) => x !== name)
    : [...config.events, name]
}
async function copy() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1600)
}
function reset() {
  Object.assign(config, defaultConfig())
  resetSelection()
  log.value = []
  void nextTick(() => live.value?.open())
}
onMounted(() => {
  void nextTick(() => live.value?.open())
})
</script>
<template>
  <div class="playground-layout">
    <div class="playground-workspace">
      <h1>Build your select.</h1>
      <p class="page-subtitle">Configure it. Preview it. Copy the Vue code.</p>
      <section class="preview-section" aria-label="Live preview">
        <h2>Preview</h2>
        <div class="preview-select">
          <component :is="LiveSelect" ref="live" v-bind="bindings">
            <template
              v-if="config.optionSlot === 'details'"
              #option="slot: OptionSlot<Framework, unknown>"
              ><span
                >{{ slot.option.name }}
                <small class="selectkit-secondary">· {{ slot.option.category }}</small></span
              ><span v-if="slot.selected" aria-hidden="true">✓</span></template
            >
            <template
              v-if="config.valueSlot === 'details'"
              #single-value="slot: ValueSlot<Framework, unknown>"
              ><span class="detail-value"
                ><strong>{{ slot.option.name }}</strong
                ><small class="selectkit-secondary">{{ slot.option.category }}</small></span
              ></template
            >
            <template
              v-if="config.display !== 'chips'"
              #selection="slot: SelectionSlot<Framework, unknown>"
              ><span>{{
                config.display === 'count'
                  ? slot.values.length
                    ? `${slot.values.length} selected`
                    : config.placeholder
                  : slot.options.map((o) => o.name).join(', ') || config.placeholder
              }}</span></template
            >
          </component>
        </div>
      </section>
      <div class="selected-output">
        <span>Selected value</span>
        <pre data-testid="selected-value">{{
          JSON.stringify(
            selected,
            null,
            Array.isArray(selected) && selected.every((x) => typeof x !== 'object') ? 0 : 2,
          )
        }}</pre>
      </div>
      <section class="code-section">
        <div class="section-heading">
          <h2>Your Vue code</h2>
          <button class="small-button" @click="copy">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="6" y="6" width="10" height="11" rx="1.5" />
              <path d="M12 6V3H3v10h3" /></svg
            >{{ copied ? 'Copied!' : 'Copy code' }}
          </button>
        </div>
        <div v-if="highlighted" class="generated-code" v-html="highlighted"></div>
        <pre v-else class="generated-code">{{ code }}</pre>
      </section>
      <section class="event-section">
        <div class="section-heading">
          <h2>Events</h2>
          <button class="quiet-button" @click="log = []">Clear log</button>
        </div>
        <p v-if="!log.length" class="muted">
          Interact with the preview to see the events you enabled.
        </p>
        <ol v-else class="event-log">
          <li v-for="(event, i) in log" :key="i">
            <span>{{ event.time }}</span
            ><code>@{{ event.name }}</code>
            <pre>{{ event.detail }}</pre>
          </li>
        </ol>
      </section>
    </div>
    <aside class="inspector" aria-label="Customize component">
      <h2>Customize</h2>
      <div class="inspector-tabs" role="tablist" aria-label="Customization category">
        <button
          v-for="name in ['Props', 'Events', 'Slots']"
          :id="`tab-${name}`"
          :key="name"
          role="tab"
          :aria-selected="tab === name"
          :aria-controls="`panel-${name}`"
          :tabindex="tab === name ? 0 : -1"
          @click="tab = name"
          @keydown.right="moveTab(1)"
          @keydown.left="moveTab(-1)"
        >
          {{ name }}
        </button>
      </div>
      <div v-if="tab === 'Props'" id="panel-Props" role="tabpanel" aria-labelledby="tab-Props">
        <section
          v-for="group in ['Selection', 'Behavior', 'Appearance']"
          :key="group"
          class="control-group"
        >
          <h3>{{ group }}</h3>
          <label v-if="group === 'Appearance'" class="control-row"
            ><span>RTL</span
            ><button
              type="button"
              role="switch"
              aria-label="RTL"
              :aria-checked="config.rtl"
              class="switch"
              @click="config.rtl = !config.rtl"
            >
              <span></span></button
          ></label>
          <template
            v-for="item in controls.filter(
              (x) => x.group === group && !advancedKeys.includes(x.key),
            )"
            :key="item.key"
          >
            <label class="control-row"
              ><span>{{ item.control }}</span
              ><button
                type="button"
                role="switch"
                :aria-label="item.control"
                :aria-checked="booleanValue(item.key)"
                :disabled="item.key === 'showSelectAll' && !config.multiple"
                class="switch"
                @click="toggle(item.key)"
              >
                <span></span></button
            ></label>
            <label v-if="item.key === 'multiple'" class="control-row"
              ><span>Stored value</span
              ><select v-model="config.storedValue" aria-label="Stored value">
                <option value="id">ID</option>
                <option value="object">Whole object</option>
                <option value="name">Mapped name</option>
              </select></label
            >
            <label v-if="item.key === 'showSelectAll'" class="control-row"
              ><span>Selected display</span
              ><select v-model="config.display" aria-label="Selected display">
                <option value="chips">Chips</option>
                <option value="count">Count</option>
                <option value="text">Text</option>
              </select></label
            >
          </template>
          <label v-if="group === 'Behavior'" class="control-row"
            ><span>Dropdown placement</span
            ><select v-model="config.placement" aria-label="Dropdown placement">
              <option value="auto">Auto</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select></label
          >
          <template v-if="group === 'Appearance'"
            ><label class="control-row"
              ><span>Placeholder</span
              ><input v-model="config.placeholder" aria-label="Placeholder" /></label
            ><label class="control-row"
              ><span>Max height</span
              ><span class="unit-input"
                ><input
                  v-model.number="config.maxHeight"
                  type="number"
                  min="72"
                  max="600"
                  aria-label="Max height"
                /><span>px</span></span
              ></label
            ></template
          >
        </section>
        <details class="advanced-controls">
          <summary>Advanced behavior</summary>
          <label
            v-for="item in controls.filter((x) => advancedKeys.includes(x.key))"
            :key="item.key"
            class="control-row"
            ><span>{{ item.control }}</span
            ><button
              type="button"
              role="switch"
              :aria-label="item.control"
              :aria-checked="booleanValue(item.key)"
              class="switch"
              @click="toggle(item.key)"
            >
              <span></span></button
          ></label>
        </details>
      </div>
      <div
        v-else-if="tab === 'Events'"
        id="panel-Events"
        role="tabpanel"
        aria-labelledby="tab-Events"
        class="control-group"
      >
        <h3>Listen to events</h3>
        <p class="muted inspector-hint">Enabled events appear in your code and the event log.</p>
        <label v-for="(description, name) in eventDocs" :key="name" class="event-control"
          ><input
            type="checkbox"
            :checked="config.events.includes(name)"
            @change="toggleEvent(name)"
          /><span
            ><code>@{{ name }}</code
            ><small>{{ description }}</small></span
          ></label
        >
      </div>
      <div
        v-else
        id="panel-Slots"
        role="tabpanel"
        aria-labelledby="tab-Slots"
        class="control-group"
      >
        <h3>Customize rendering</h3>
        <p class="muted inspector-hint">
          Try a slot preset. The generated code includes its template.
        </p>
        <label class="stacked-control"
          >Option slot<select v-model="config.optionSlot" aria-label="Option slot">
            <option value="default">Default</option>
            <option value="details">Name + category</option>
          </select></label
        ><label class="stacked-control"
          >Single value slot<select v-model="config.valueSlot" aria-label="Single value slot">
            <option value="default">Default</option>
            <option value="details">Name + category</option>
          </select></label
        ><label class="stacked-control"
          >Selection slot<select v-model="config.display" aria-label="Selection slot">
            <option value="chips">Default chips</option>
            <option value="count">Selected count</option>
            <option value="text">Comma-separated text</option>
          </select></label
        ><a class="text-link" href="/vue3-selectkit/api/slots">View all slots →</a>
      </div>
      <div class="inspector-reset"><button class="small-button" @click="reset">Reset</button></div>
    </aside>
  </div>
</template>

<style scoped>
.selectkit-secondary {
  color: #667085;
  font-size: 11px;
}
.selectkit-value {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
</style>
