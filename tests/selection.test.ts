import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, shallowRef, nextTick, type Component } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { VueMultiselect } from '../packages/selectkit/src'
const Select = VueMultiselect as Component
const users = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Disabled', disabled: true },
]
function setup(props: Record<string, unknown> = {}) {
  const model = shallowRef<unknown>(props.modelValue ?? (props.multiple ? [] : null))
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Select, {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (v: unknown) => {
            model.value = v
          },
        }),
    }),
    { attachTo: document.body },
  )
  const select = wrapper.findComponent(Select)
  return {
    wrapper,
    select,
    model,
    open: async () => {
      await wrapper.find('.vsk-trigger').trigger('click')
      await flushPromises()
    },
  }
}
describe('selection and rendering', () => {
  it('applies styling attributes to the root and native attributes to the control', () => {
    const wrapper = mount(Select, {
      props: { options: ['One'] },
      attrs: { class: 'my-select', style: 'width: 200px', 'data-testid': 'native-control' },
    })
    expect(wrapper.classes()).toContain('my-select')
    expect((wrapper.element as HTMLElement).style.width).toBe('200px')
    expect(wrapper.find('.vsk-trigger').attributes('data-testid')).toBe('native-control')
  })
  it('uses scalar or null for single selection and closes by default', async () => {
    const { wrapper, select, model, open } = setup({ options: ['Apple', 'Pear'] })
    await open()
    await wrapper.find('[role=option]').trigger('click')
    expect(model.value).toBe('Apple')
    expect(wrapper.find('[role=listbox]').exists()).toBe(false)
    await wrapper.find('.vsk-clear').trigger('click')
    expect(model.value).toBeNull()
    expect(select.emitted('change')?.at(-1)?.[1]).toMatchObject({ reason: 'clear' })
  })
  it('keeps objects by default and matches replacement records by stable key', async () => {
    const { wrapper, model, open } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      modelValue: { ...users[0] },
    })
    await open()
    expect(wrapper.find('[role=option]').attributes('aria-selected')).toBe('true')
    await wrapper.findAll('[role=option]')[1]!.trigger('click')
    expect(model.value).toEqual(users[1])
  })
  it('maps a value field without changing the displayed label', async () => {
    const { wrapper, model, open } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      valueKey: 'id',
    })
    await open()
    await wrapper.find('[role=option]').trigger('click')
    expect(model.value).toBe(1)
    expect(wrapper.find('.vsk-selection').text()).toBe('Ada')
  })
  it('supports custom projected objects and comparison', async () => {
    const { wrapper, model, open } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      getOptionValue: (o: (typeof users)[number]) => ({ key: o.id }),
      isValueEqual: (a: { key: number }, b: { key: number }) => a.key === b.key,
      modelValue: { key: 2 },
    })
    await open()
    expect(wrapper.findAll('[role=option]')[1]!.attributes('aria-selected')).toBe('true')
    await wrapper.find('[role=option]').trigger('click')
    expect(model.value).toEqual({ key: 1 })
  })
  it('does not mutate input arrays and emits one change per bulk action', async () => {
    const original = Object.freeze([1])
    const { wrapper, model, select, open } = setup({
      options: Object.freeze(users),
      optionKey: 'id',
      labelKey: 'name',
      valueKey: 'id',
      multiple: true,
      showSelectAll: true,
      modelValue: original,
    })
    await open()
    expect(wrapper.find('[role=checkbox]').attributes('aria-checked')).toBe('mixed')
    await wrapper.find('[role=checkbox]').trigger('click')
    expect(model.value).toEqual([1, 2])
    expect(original).toEqual([1])
    expect(select.emitted('change')).toHaveLength(1)
    expect(wrapper.find('[role=checkbox]').attributes('aria-checked')).toBe('true')
    await wrapper.find('[role=checkbox]').trigger('click')
    expect(model.value).toEqual([])
  })
  it('bulk actions affect matching enabled options and preserve other selections', async () => {
    const { wrapper, model, open } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      valueKey: 'id',
      multiple: true,
      showSelectAll: true,
      searchable: true,
      modelValue: [2],
    })
    await open()
    await wrapper.find('input').setValue('ad')
    expect(wrapper.findAll('[role=option]')).toHaveLength(1)
    await wrapper.find('[role=checkbox]').trigger('click')
    expect(model.value).toEqual([2, 1])
    await wrapper.find('[role=checkbox]').trigger('click')
    expect(model.value).toEqual([2])
  })
  it('respects disabled and selection limits', async () => {
    const { wrapper, model, open } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      multiple: true,
      showSelectAll: true,
      maxSelected: 1,
    })
    await open()
    expect(wrapper.find('[role=checkbox]').attributes('disabled')).toBeDefined()
    await wrapper.find('[role=option]').trigger('click')
    await wrapper.findAll('[role=option]')[1]!.trigger('click')
    expect(model.value).toEqual([users[0]])
    const disabled = setup({ options: users, disabled: true })
    await disabled.open()
    expect(disabled.wrapper.find('[role=listbox]').exists()).toBe(false)
  })
  it('preserves labels when options disappear and does not echo external updates', async () => {
    const wrapper = mount(Select, {
      props: { options: users, optionKey: 'id', labelKey: 'name', valueKey: 'id', modelValue: 1 },
    })
    await wrapper.setProps({ options: [] })
    expect(wrapper.find('.vsk-selection').text()).toBe('Ada')
    await wrapper.setProps({ modelValue: 2, options: users })
    expect(wrapper.emitted('change')).toBeUndefined()
  })
  it('groups options while retaining their values', async () => {
    const { wrapper, model, open } = setup({
      options: [
        { id: 1, name: 'One', group: 'A' },
        { id: 2, name: 'Two', group: 'B' },
      ],
      optionKey: 'id',
      labelKey: 'name',
      groupBy: 'group',
      valueKey: 'id',
    })
    await open()
    expect(wrapper.findAll('.vsk-group').map((x) => x.text())).toEqual(['A', 'B'])
    await wrapper.findAll('[role=option]')[1]!.trigger('click')
    expect(model.value).toBe(2)
  })
  it('uses keyboard navigation and skips unavailable options', async () => {
    const { wrapper, model, open } = setup({ options: ['One', 'Two', 'Three'] })
    await open()
    await wrapper.find('.vsk-trigger').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.find('.vsk-trigger').trigger('keydown', { key: 'Enter' })
    expect(model.value).toBe('Two')
  })
  it('restores focus on Escape without reopening open-on-focus controls', async () => {
    const { wrapper, open } = setup({ options: ['One'], searchable: true, openOnFocus: true })
    await open()
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role=listbox]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.vsk-trigger').element)
  })
})
describe('remote loading and creation', () => {
  it('ignores stale loader responses even when cancellation is ignored', async () => {
    const calls: { query: string; signal: AbortSignal; resolve: (x: string[]) => void }[] = []
    const loader = vi.fn(
      (query: string, { signal }: { signal: AbortSignal }) =>
        new Promise<string[]>((resolve) => calls.push({ query, signal, resolve })),
    )
    const { wrapper, open } = setup({ loadOptions: loader, searchable: true, debounce: 0 })
    await open()
    await wrapper.find('input').setValue('new')
    await new Promise((r) => setTimeout(r, 5))
    expect(calls[0]!.signal.aborted).toBe(true)
    calls[1]!.resolve(['New result'])
    await flushPromises()
    calls[0]!.resolve(['Stale result'])
    await flushPromises()
    expect(wrapper.find('[role=option]').text()).toBe('New result')
  })
  it('does not locally filter loader results and exposes retryable failures', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(['Ranked result'])
    const { wrapper, select, open } = setup({ loadOptions: loader, searchable: true, debounce: 0 })
    await open()
    expect(wrapper.find('[role=alert]').text()).toContain('Could not load')
    expect(select.emitted('load-error')).toHaveLength(1)
    await wrapper.find('[role=alert] button').trigger('click')
    await flushPromises()
    await wrapper.find('input').setValue('query not in label')
    await new Promise((r) => setTimeout(r, 5))
    await flushPromises()
    expect(wrapper.find('[role=option]').text()).toBe('Ranked result')
  })
  it('creates and selects a typed option once; protects against double submissions', async () => {
    let resolve!: (o: { id: number; name: string }) => void
    const createOption = vi.fn(
      () =>
        new Promise<{ id: number; name: string }>((r) => {
          resolve = r
        }),
    )
    const { wrapper, model, select, open } = setup({
      options: [],
      optionKey: 'id',
      labelKey: 'name',
      valueKey: 'id',
      searchable: true,
      createOption,
    })
    await open()
    await wrapper.find('input').setValue('New')
    await wrapper.find('.vsk-create').trigger('click')
    await wrapper.find('.vsk-create').trigger('click')
    expect(createOption).toHaveBeenCalledTimes(1)
    resolve({ id: 7, name: 'New' })
    await flushPromises()
    expect(model.value).toBe(7)
    expect(select.emitted('create')).toEqual([[{ id: 7, name: 'New' }]])
  })
  it('retains query and emits an error when creation fails or duplicates a key', async () => {
    const { wrapper, model, select, open } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      searchable: true,
      createOption: () => ({ id: 1, name: 'Duplicate' }),
    })
    await open()
    await wrapper.find('input').setValue('New')
    await wrapper.find('.vsk-create').trigger('click')
    await flushPromises()
    expect(wrapper.find('input').element.value).toBe('New')
    expect(model.value).toBeNull()
    expect(select.emitted('create-error')).toHaveLength(1)
  })
  it('aborts pending work when unmounted', async () => {
    let signal!: AbortSignal
    const { wrapper, open } = setup({
      loadOptions: (_q: string, ctx: { signal: AbortSignal }) => {
        signal = ctx.signal
        return new Promise(() => {})
      },
    })
    await open()
    wrapper.unmount()
    expect(signal.aborted).toBe(true)
  })
})
describe('native forms', () => {
  it('serializes multiple object keys and supports custom serialization', async () => {
    const { wrapper } = setup({
      options: users,
      optionKey: 'id',
      labelKey: 'name',
      multiple: true,
      modelValue: [users[0], users[1]],
      name: 'users',
    })
    const form = document.createElement('form')
    wrapper.element.parentNode!.insertBefore(form, wrapper.element)
    form.append(wrapper.element)
    expect(new FormData(form).getAll('users')).toEqual(['1', '2'])
    wrapper.unmount()
    form.remove()
    const other = setup({
      options: users,
      optionKey: 'id',
      modelValue: users[0],
      name: 'user',
      serializeValue: () => 'custom',
    })
    expect(other.wrapper.find('select option').attributes('value')).toBe('custom')
  })
  it('validates an empty required multiple select', async () => {
    const { wrapper } = setup({ options: ['One'], multiple: true, required: true })
    const native = wrapper.find('select').element
    expect(native.checkValidity()).toBe(false)
    await nextTick()
    expect(wrapper.find('.vsk-trigger').attributes('aria-invalid')).toBe('true')
  })
  it('resets to the mounted model and respects canceled reset events', async () => {
    const model = shallowRef<string | null>('One')
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('form', {}, [
            h(Select, {
              options: ['One', 'Two'],
              name: 'value',
              modelValue: model.value,
              'onUpdate:modelValue': (v: string | null) => {
                model.value = v
              },
            }),
          ]),
      }),
      { attachTo: document.body },
    )
    model.value = 'Two'
    await nextTick()
    ;(wrapper.element as HTMLFormElement).reset()
    await flushPromises()
    expect(model.value).toBe('One')
    model.value = 'Two'
    await nextTick()
    wrapper.element.addEventListener('reset', (e) => e.preventDefault(), { once: true })
    ;(wrapper.element as HTMLFormElement).reset()
    await flushPromises()
    expect(model.value).toBe('Two')
  })
})
