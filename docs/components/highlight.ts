import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
const highlighter = createHighlighterCore({
  themes: [
    import('shiki/themes/github-light-high-contrast.mjs'),
    import('shiki/themes/github-dark-high-contrast.mjs'),
  ],
  langs: [
    import('shiki/langs/vue.mjs'),
    import('shiki/langs/typescript.mjs'),
    import('shiki/langs/javascript.mjs'),
    import('shiki/langs/html.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/json.mjs'),
  ],
  engine: createOnigurumaEngine(import('shiki/wasm')),
})
export async function highlight(code: string) {
  return (await highlighter).codeToHtml(code, {
    lang: 'vue',
    themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
  })
}
