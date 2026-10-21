import { writeFile } from 'node:fs/promises'
await writeFile(new URL('../dist/style.css.d.ts', import.meta.url), 'export {}\n')
