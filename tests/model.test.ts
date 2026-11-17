import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { VueMultiselect } from '../packages/selectkit/src'

describe('defineModel selection state', () => {
  it.each([false, true])(
    'selects, clears and resets without v-model, multiple=%s',
    async (multiple) => {
      const form = document.createElement('form')
      document.body.append(form)
      const wrapper = mount(VueMultiselect, {
        attachTo: form,
        props: { options: ['One', 'Two'], multiple, name: 'value' },
      })
      try {
        expect(new FormData(form).getAll('value')).toEqual(multiple ? [] : [''])
        await wrapper.find('.vsk-trigger').trigger('click')
        await wrapper.find('[role=option]').trigger('click')
        expect(wrapper.find('.vsk-selection').text()).toBe('One')
        expect(wrapper.emitted('update:modelValue')).toEqual([[multiple ? ['One'] : 'One']])
        expect(new FormData(form).getAll('value')).toEqual(['One'])
        form.reset()
        await flushPromises()
        expect(new FormData(form).getAll('value')).toEqual(multiple ? [] : [''])
        expect(wrapper.emitted('change')?.at(-1)).toEqual([
          multiple ? [] : null,
          { reason: 'reset', options: [] },
        ])
        await wrapper.find('.vsk-trigger').trigger('click')
        await wrapper.find('[role=option]').trigger('click')
        await wrapper.find('.vsk-clear').trigger('click')
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([multiple ? [] : null])
        expect(new FormData(form).getAll('value')).toEqual(multiple ? [] : [''])
      } finally {
        wrapper.unmount()
        form.remove()
      }
    },
  )

  it('keeps listener-only usage local while emitting update before change', async () => {
    const order: string[] = []
    const wrapper = mount(VueMultiselect, {
      props: {
        options: ['One'],
        'onUpdate:modelValue': () => order.push('update'),
        onChange: () => order.push('change'),
      },
    })
    await wrapper.find('.vsk-trigger').trigger('click')
    await wrapper.find('[role=option]').trigger('click')
    expect(wrapper.find('.vsk-selection').text()).toBe('One')
    expect(order).toEqual(['update', 'change'])
  })

  it('waits for a controlled parent to accept a selection and never echoes prop updates', async () => {
    const update = vi.fn()
    const wrapper = mount(VueMultiselect, {
      props: { options: ['One', 'Two'], modelValue: 'One', 'onUpdate:modelValue': update },
    })
    await wrapper.find('.vsk-trigger').trigger('click')
    await wrapper.findAll('[role=option]')[1]!.trigger('click')
    expect(update).toHaveBeenCalledExactlyOnceWith('Two')
    expect(wrapper.find('.vsk-selection').text()).toBe('One')
    await wrapper.setProps({ modelValue: 'Two' })
    expect(wrapper.find('.vsk-selection').text()).toBe('Two')
    expect(update).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('treats a modelValue without an update listener as initial local state', async () => {
    const wrapper = mount(VueMultiselect, {
      props: { options: ['One', 'Two'], modelValue: 'One' },
    })
    await wrapper.find('.vsk-trigger').trigger('click')
    await wrapper.findAll('[role=option]')[1]!.trigger('click')
    expect(wrapper.find('.vsk-selection').text()).toBe('Two')
    await wrapper.setProps({ modelValue: 'Two' })
    await wrapper.setProps({ modelValue: 'One' })
    expect(wrapper.find('.vsk-selection').text()).toBe('One')
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('accepts an initially undefined controlled model without a child default', async () => {
    const update = vi.fn()
    const wrapper = mount(VueMultiselect, {
      props: { options: ['One'], modelValue: undefined, 'onUpdate:modelValue': update },
    })
    expect(update).not.toHaveBeenCalled()
    await wrapper.find('.vsk-trigger').trigger('click')
    await wrapper.find('[role=option]').trigger('click')
    expect(update).toHaveBeenCalledExactlyOnceWith('One')
    await wrapper.setProps({ modelValue: 'One' })
    expect(wrapper.find('.vsk-selection').text()).toBe('One')
    await wrapper.setProps({ modelValue: undefined })
    expect(wrapper.find('.vsk-clear').exists()).toBe(false)
    expect(update).toHaveBeenCalledTimes(1)
  })
})
