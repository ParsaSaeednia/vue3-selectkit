import { it, expect, vi } from 'vitest'
import { createSSRApp, h, nextTick, type Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { VueMultiselect } from '../packages/selectkit/src'
it('hydrates selected objects without ID or markup mismatches', async () => {
  const options = [{ id: 1, name: 'Ada' }]
  const create = () =>
    createSSRApp({
      render: () =>
        h(VueMultiselect as Component, {
          options,
          modelValue: options[0],
          optionKey: 'id',
          labelKey: 'name',
          label: 'User',
        }),
    })
  const container = document.createElement('div')
  container.innerHTML = await renderToString(create())
  document.body.append(container)
  const warn = vi.spyOn(console, 'warn')
  const error = vi.spyOn(console, 'error')
  const app = create()
  app.mount(container)
  await nextTick()
  expect(container.textContent).toContain('Ada')
  expect(warn).not.toHaveBeenCalled()
  expect(error).not.toHaveBeenCalled()
  app.unmount()
  container.remove()
  warn.mockRestore()
  error.mockRestore()
})
