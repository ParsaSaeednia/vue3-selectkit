import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { tsImport } from 'tsx/esm/api'
const root = resolve('.')
const dir = await mkdtemp(join(tmpdir(), 'selectkit-consumer-'))
let spec = process.env.SELECTKIT_PACKAGE_SPEC
if (!spec) {
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '-w', 'vue3-selectkit', '--json', '--pack-destination', dir], {
      encoding: 'utf8',
    }),
  )[0]
  const unexpected = packed.files.filter(
    (file) => !/^(dist\/|package\.json$|README\.md$|LICENSE$)/.test(file.path),
  )
  if (unexpected.length)
    throw new Error(`Unexpected published files: ${unexpected.map((x) => x.path).join(', ')}`)
  for (const required of [
    'dist/selectkit.js',
    'dist/index.d.ts',
    'dist/VueMultiselect.vue.d.ts',
    'dist/style.css',
    'README.md',
    'LICENSE',
  ])
    if (!packed.files.some((f) => f.path === required)) throw new Error(`Missing ${required}`)
  spec = join(dir, packed.filename)
  console.log(`Validated tarball: ${spec}`)
}
await writeFile(
  join(dir, 'package.json'),
  JSON.stringify({
    private: true,
    type: 'module',
    dependencies: { vue: '^3.5.44', 'vue3-selectkit': spec },
  }),
)
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: dir,
  stdio: 'inherit',
})
const { generateExample } = await tsImport('../docs/components/generate.ts', import.meta.url)
const { defaultConfig } = await tsImport('../docs/components/metadata.ts', import.meta.url)
await writeFile(
  join(dir, 'App.vue'),
  generateExample({
    ...defaultConfig(),
    loadOptions: true,
    createOption: true,
    optionSlot: 'details',
    display: 'count',
  }),
)
await writeFile(
  join(dir, 'main.ts'),
  "import { createApp } from 'vue'; import App from './App.vue'; createApp(App).mount('#app')",
)
await writeFile(
  join(dir, 'index.html'),
  '<div id="app"></div><script type="module" src="/main.ts"></script>',
)
await writeFile(
  join(dir, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      lib: ['ES2022', 'DOM'],
      noEmit: true,
      types: [],
    },
    include: ['*.ts', '*.vue'],
  }),
)
execFileSync(resolve('node_modules/.bin/vue-tsc'), ['-p', join(dir, 'tsconfig.json'), '--noEmit'], {
  cwd: dir,
  stdio: 'inherit',
})
await writeFile(
  join(dir, 'vite.config.mjs'),
  `import vue from '${pathToFileURL(join(root, 'node_modules/@vitejs/plugin-vue/dist/index.mjs')).href}'; export default { plugins: [vue()] }`,
)
execFileSync(
  resolve('node_modules/.bin/vite'),
  ['build', '--config', join(dir, 'vite.config.mjs')],
  { cwd: dir, stdio: 'inherit' },
)
const manifest = JSON.parse(
  await readFile(join(dir, 'node_modules/vue3-selectkit/package.json'), 'utf8'),
)
if (manifest.dependencies?.vue) throw new Error('Vue must remain a peer dependency')
console.log(`Clean consumer passed: ${manifest.name}@${manifest.version}`)
