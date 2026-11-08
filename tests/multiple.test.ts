import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import Multiple from './fixtures/Multiple.vue'

describe('multiple in compiled Vue templates', () => {
  it.each(['shorthand', 'empty', 'true', 'false', 'omitted', 'dynamic'])(
    'uses the correct labels, model shape, selection and FormData for %s',
    async (mode) => {
      const wrapper = mount(Multiple, { attachTo: document.body })
      const field = wrapper.find(`[data-mode="${mode}"]`)
      const multiple = !['false', 'omitted'].includes(mode)
      expect(field.find('.vsk-selection').text()).toBe('Ada')
      expect((field.find('select').element as HTMLSelectElement).multiple).toBe(multiple)
      await field.find('.vsk-trigger').trigger('click')
      await field.findAll('[role=option]')[1]!.trigger('click')
      expect(field.find('pre').text()).toBe(multiple ? '[1,2]' : '2')
      expect(new FormData(wrapper.element as HTMLFormElement).getAll(mode)).toEqual(
        multiple ? ['1', '2'] : ['2'],
      )
      await field.find('.vsk-clear').trigger('click')
      expect(field.find('pre').text()).toBe(multiple ? '[]' : 'null')
    },
  )

  it('preserves boolean bindings when switching between single and multiple', async () => {
    const wrapper = mount(Multiple, { attachTo: document.body })
    const field = wrapper.find('[data-mode=dynamic]')
    await field.find('section > button').trigger('click')
    expect((field.find('select').element as HTMLSelectElement).multiple).toBe(false)
    await field.find('.vsk-trigger').trigger('click')
    await field.findAll('[role=option]')[1]!.trigger('click')
    expect(field.find('pre').text()).toBe('2')
    await field.find('section > button').trigger('click')
    expect((field.find('select').element as HTMLSelectElement).multiple).toBe(true)
    await field.find('.vsk-trigger').trigger('click')
    await field.findAll('[role=option]')[1]!.trigger('click')
    expect(field.find('pre').text()).toBe('[1,2]')
  })

  it('renders and hydrates all template forms with labels and stable IDs', async () => {
    const html = await renderToString(createSSRApp(Multiple))
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const before = [...container.querySelectorAll('.vsk-trigger')].map((element) => element.id)
    expect(new Set(before).size).toBe(6)
    expect(
      [...container.querySelectorAll('.vsk-selection')].map((element) => element.textContent),
    ).toEqual(Array(6).fill('Ada'))
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const app = createSSRApp(Multiple)
    try {
      app.mount(container)
      await nextTick()
      await flushPromises()
      expect([...container.querySelectorAll('.vsk-trigger')].map((element) => element.id)).toEqual(
        before,
      )
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
    } finally {
      app.unmount()
      container.remove()
      warn.mockRestore()
      error.mockRestore()
    }
  })
})
