import { tsImport } from 'tsx/esm/api'
import { mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
const { generateExample, exampleCases } = await tsImport(
  '../docs/components/generate.ts',
  import.meta.url,
)
const { defaultConfig, eventDocs } = await tsImport(
  '../docs/components/metadata.ts',
  import.meta.url,
)
const dir = resolve('node_modules/.cache/selectkit-examples')
await rm(dir, { recursive: true, force: true })
await mkdir(dir, { recursive: true })
const base = defaultConfig()
const cases = [
  ...exampleCases,
  { ...base, virtual: true, storedValue: 'name' },
  {
    ...base,
    paginated: true,
    resolveOptions: true,
    groupBy: true,
    showGroupSelect: true,
    maxVisibleTags: 1,
  },
  { ...base, display: 'count', placeholder: '</script> }} & \"hello\"' },
]
for (const key of Object.keys(base))
  if (typeof base[key] === 'boolean') cases.push({ ...base, [key]: !base[key] })
for (const multiple of [false, true])
  for (const storedValue of ['object', 'id', 'name'])
    cases.push({ ...base, multiple, storedValue, events: Object.keys(eventDocs) })
cases.push({
  ...base,
  placeholder: 'Pick "your" <framework> & enjoy',
  optionSlot: 'details',
  valueSlot: 'details',
  display: 'text',
  placement: 'top',
})
for (const [i, config] of cases.entries())
  await writeFile(resolve(dir, `Example${i}.vue`), generateExample(config))
const agentGuide = await readFile(resolve('packages/selectkit/AGENTS.md'), 'utf8')
const agentExamples = [...agentGuide.matchAll(/```vue\n([\s\S]*?)\n```/g)]
for (const [i, match] of agentExamples.entries())
  await writeFile(resolve(dir, `AgentExample${i}.vue`), match[1])
let documentationExamples = 0
for (const file of [
  'README.md',
  ...(await readdir('docs/guide'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => `docs/guide/${name}`),
]) {
  const markdown = await readFile(file, 'utf8')
  for (const match of markdown.matchAll(/```vue\n([\s\S]*?)\n```/g)) {
    if (!match[1].includes('<script setup') || !match[1].includes('<template>')) continue
    await writeFile(resolve(dir, `Documentation${documentationExamples++}.vue`), match[1])
  }
}
await writeFile(
  resolve(dir, 'tsconfig.json'),
  JSON.stringify({ extends: '../../../tsconfig.json', include: ['./*.vue'], exclude: [] }),
)
execFileSync(
  resolve('node_modules/.bin/vue-tsc'),
  ['--noEmit', '-p', resolve(dir, 'tsconfig.json')],
  { stdio: 'inherit' },
)
console.log(`Type-checked ${cases.length} complete generated Vue examples.`)
console.log(`Type-checked ${agentExamples.length} complete AGENTS.md Vue examples.`)
console.log(`Type-checked ${documentationExamples} complete README/guide Vue examples.`)
