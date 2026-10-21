// @vitest-environment node
import { it, expect } from 'vitest'
import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { VueMultiselect } from '../packages/selectkit/src'
it('renders safely without browser globals and produces stable accessible markup', async () => {
  const app = () =>
    createSSRApp({
      render: () =>
        h(VueMultiselect as Component, { options: ['One'], modelValue: 'One', label: 'Number' }),
    })
  const first = await renderToString(app())
  const second = await renderToString(app())
  expect(first).toBe(second)
  expect(first).toContain('role="combobox"')
  expect(first).toContain('One')
})
