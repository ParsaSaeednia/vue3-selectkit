import { execFileSync, spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from '@playwright/test'
import { checkApp } from '../tests/nuxt/check-app.mjs'

const versions = JSON.parse(await readFile(resolve('tests/nuxt/versions.json'), 'utf8'))
const majors = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(versions)
for (const major of majors)
  if (!versions[major]) throw new Error(`Unsupported Nuxt major: ${major}; use 3 or 4`)
const rootPackage = JSON.parse(await readFile(resolve('package.json'), 'utf8'))
const manifest = JSON.parse(await readFile(resolve('packages/selectkit/package.json'), 'utf8'))
const workspace = await mkdtemp(join(tmpdir(), 'selectkit-nuxt-'))
let spec = process.env.SELECTKIT_PACKAGE_SPEC
if (!spec) {
  const [archive] = JSON.parse(
    execFileSync(
      'npm',
      ['pack', '-w', 'vue3-selectkit', '--json', '--pack-destination', workspace],
      { encoding: 'utf8' },
    ),
  )
  spec = join(workspace, archive.filename)
}

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
  })
}
async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}
let browser
let success = false
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BRAVE_EXECUTABLE_PATH
      ? { executablePath: process.env.BRAVE_EXECUTABLE_PATH }
      : {}),
  })
  for (const major of majors) {
    const dir = join(workspace, `nuxt-${major}`)
    await mkdir(major === '3' ? dir : join(dir, 'app'), { recursive: true })
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({
        private: true,
        type: 'module',
        dependencies: {
          nuxt: versions[major],
          vue: '^3.5.44',
          'vue-router': '^4.0.0',
          'vue3-selectkit': spec,
        },
        devDependencies: {
          typescript: rootPackage.devDependencies.typescript,
          'vue-tsc': rootPackage.devDependencies['vue-tsc'],
        },
      }),
    )
    await writeFile(
      join(dir, 'nuxt.config.ts'),
      `export default defineNuxtConfig({ buildDir: '.nuxt', compatibilityDate: '2026-11-08', devtools: { enabled: false }, css: ['vue3-selectkit/style.css'], typescript: { strict: true } })\n`,
    )
    await writeFile(
      join(dir, major === '3' ? 'app.vue' : 'app/app.vue'),
      await readFile(resolve('tests/nuxt/App.vue'), 'utf8'),
    )
    await writeFile(
      join(dir, 'tsconfig.json'),
      JSON.stringify(
        major === '3'
          ? { extends: './.nuxt/tsconfig.json' }
          : {
              files: [],
              references: ['app', 'server', 'shared', 'node'].map((part) => ({
                path: `./.nuxt/tsconfig.${part}.json`,
              })),
            },
      ),
    )
    console.log(`Checking packed vue3-selectkit in Nuxt ${versions[major]} (${dir})`)
    run('npm', ['install', '--no-audit', '--no-fund'], dir)
    const installed = JSON.parse(
      await readFile(join(dir, 'node_modules/vue3-selectkit/package.json'), 'utf8'),
    )
    assertVersion(installed.version)
    run(process.execPath, [join(dir, 'node_modules/nuxt/bin/nuxt.mjs'), 'build'], dir)
    run(process.execPath, [join(dir, 'node_modules/nuxt/bin/nuxt.mjs'), 'typecheck'], dir)
    const port = await freePort()
    const url = `http://127.0.0.1:${port}/`
    let logs = ''
    const server = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    })
    server.stdout.on('data', (chunk) => {
      logs = (logs + chunk).slice(-20000)
    })
    server.stderr.on('data', (chunk) => {
      logs = (logs + chunk).slice(-20000)
    })
    try {
      const deadline = Date.now() + 30000
      while (true) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
          if (response.ok) break
        } catch {}
        if (server.exitCode != null || Date.now() > deadline)
          throw new Error(`Nuxt server did not start: ${logs}`)
        await delay(100)
      }
      await checkApp(browser, url)
      console.log(
        `PASS Nuxt ${versions[major]}: packed ${installed.name}@${installed.version}, types, production SSR, hydration, shorthand/bound/dynamic modes, forms, keyboard, groups, tag overflow, read-only, async paging/resolution/creation, #teleports; no browser warnings.`,
      )
    } catch (error) {
      console.error(logs)
      throw error
    } finally {
      if (server.exitCode == null) {
        server.kill('SIGTERM')
        await Promise.race([new Promise((resolve) => server.once('exit', resolve)), delay(5000)])
        if (server.exitCode == null) server.kill('SIGKILL')
      }
    }
  }
  success = true
} finally {
  await browser?.close()
  if (success) await rm(workspace, { recursive: true, force: true })
  else console.error(`Nuxt verification files retained at ${workspace}`)
}
function assertVersion(version) {
  if (!process.env.SELECTKIT_PACKAGE_SPEC && version !== manifest.version)
    throw new Error(`Expected ${manifest.version}, installed ${version}`)
}
