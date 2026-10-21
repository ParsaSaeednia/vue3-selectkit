import { defaultConfig, frameworks, type PlaygroundConfig } from './metadata'
const literal = (s: string) => JSON.stringify(s).replace(/</g, '\\u003c')
export function generateExample(config: PlaygroundConfig): string {
  const c = config
  const type = c.storedValue === 'id' ? 'number' : c.storedValue === 'name' ? 'string' : 'Framework'
  const initial =
    c.storedValue === 'id'
      ? ['1', '3']
      : c.storedValue === 'name'
        ? c.virtual
          ? ["'Framework 1'", "'Framework 3'"]
          : ["'Vue'", "'Svelte'"]
        : ['frameworks[0]!', 'frameworks[2]!']
  const lines = [
    '  v-model="selected"',
    '  :options="frameworks"',
    '  option-key="id"',
    '  label-key="name"',
    `  label="${c.rtl ? 'فریم‌ورک‌ها' : 'Frameworks'}"`,
  ]
  if (c.storedValue === 'id') lines.push('  value-key="id"')
  if (c.storedValue === 'name') lines.push('  :get-option-value="getName"')
  for (const [key, prop] of Object.entries({
    multiple: 'multiple',
    searchable: 'searchable',
    showSelectAll: 'show-select-all',
    disabled: 'disabled',
    loading: 'loading',
    virtual: 'virtual',
    openOnFocus: 'open-on-focus',
    teleport: 'teleport',
    unstyled: 'unstyled',
  }))
    if (c[key as keyof PlaygroundConfig]) lines.push(`  ${prop}`)
  lines.push(`  :close-on-select="${c.closeOnSelect}"`)
  if (!c.clearable) lines.push('  :clearable="false"')
  if (c.groupBy) lines.push('  group-by="category"')
  if (c.rtl) lines.push('  dir="rtl"')
  if (c.placement !== 'auto') lines.push(`  placement="${c.placement}"`)
  lines.push('  :placeholder="placeholder"', `  :max-height="${c.maxHeight}"`)
  if (c.loadOptions) lines.push('  :load-options="loadOptions"')
  if (c.createOption) lines.push('  :create-option="createOption"')
  for (const event of c.events) lines.push(`  @${event}="onEvent"`)
  const slots: string[] = []
  if (c.optionSlot === 'details')
    slots.push(
      '  <template #option="{ option, selected }">\n    <span>{{ option.name }} <small class="selectkit-secondary">· {{ option.category }}</small></span>\n    <span v-if="selected" aria-hidden="true">✓</span>\n  </template>',
    )
  if (c.valueSlot === 'details')
    slots.push(
      '  <template #single-value="{ option }">\n    <span class="selectkit-value"><strong>{{ option.name }}</strong><small class="selectkit-secondary">{{ option.category }}</small></span>\n  </template>',
    )
  if (c.display === 'count')
    slots.push(
      '  <template #selection="{ values }">\n    {{ values.length ? `${values.length} selected` : placeholder }}\n  </template>',
    )
  if (c.display === 'text')
    slots.push(
      '  <template #selection="{ options }">\n    {{ options.map(option => option.name).join(\', \') || placeholder }}\n  </template>',
    )
  const modelType = c.multiple ? `${type}[]` : `${type} | null`
  const data = c.virtual
    ? 'Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: `Framework ${i + 1}`, category: `Group ${i % 5}` }))'
    : `[\n${frameworks.map((option) => '  ' + JSON.stringify(option)).join(',\n')}\n]`
  let script = `import { ref } from 'vue'\nimport { VueMultiselect${c.loadOptions || c.createOption ? ', type AsyncContext' : ''} } from 'vue3-selectkit'\nimport 'vue3-selectkit/style.css'\n\ninterface Framework { id: number; name: string; category: string; disabled?: boolean }\nconst frameworks: Framework[] = ${data}\nconst selected = ref<${modelType}>(${c.multiple ? `[${initial.join(', ')}]` : initial[0]})`
  script += `\nconst placeholder = ${literal(c.placeholder)}`
  if (c.storedValue === 'name')
    script += '\n\nfunction getName(option: Framework): string { return option.name }'
  if (c.loadOptions)
    script +=
      "\n\nasync function loadOptions(query: string, { signal }: AsyncContext): Promise<Framework[]> {\n  await new Promise<void>((resolve, reject) => {\n    const timer = setTimeout(resolve, 350)\n    signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })\n  })\n  return frameworks.filter(option => option.name.toLowerCase().includes(query.toLowerCase()))\n}"
  if (c.createOption)
    script +=
      "\n\nlet nextId = Math.max(...frameworks.map(option => option.id))\nfunction createOption(query: string): Framework {\n  return { id: ++nextId, name: query, category: 'Custom' }\n}"
  if (c.events.length) script += '\n\nfunction onEvent(...args: unknown[]) { console.log(...args) }'
  const styles =
    c.optionSlot === 'details' || c.valueSlot === 'details'
      ? '\n<style scoped>\n.selectkit-secondary { color: #667085; font-size: 11px }\n.selectkit-value { display: flex; flex-direction: column; line-height: 1.35 }\n</style>\n'
      : ''
  return `<script setup lang="ts">\n${script}\n<\/script>\n\n<template>\n<VueMultiselect\n${lines.join('\n')}\n${slots.length ? `>\n${slots.join('\n')}\n</VueMultiselect>` : '/>'}\n</template>\n${styles}`
}
export const exampleCases: PlaygroundConfig[] = [
  defaultConfig(),
  { ...defaultConfig(), multiple: false, storedValue: 'object', valueSlot: 'details' },
  { ...defaultConfig(), storedValue: 'name', display: 'count', optionSlot: 'details' },
  {
    ...defaultConfig(),
    loadOptions: true,
    createOption: true,
    virtual: true,
    groupBy: true,
    rtl: true,
  },
  { ...defaultConfig(), display: 'text', unstyled: true, teleport: true },
]
