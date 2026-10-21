import { tsImport } from 'tsx/esm/api'
import { mkdir, writeFile, rm } from 'node:fs/promises'
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
