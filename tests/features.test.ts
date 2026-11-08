import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, shallowRef, type Component } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { VueMultiselect } from '../packages/selectkit/src'

const Select = VueMultiselect as Component
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function setup(props: Record<string, unknown> = {}, inForm = false) {
  const model = shallowRef<unknown>(props.modelValue ?? (props.multiple ? [] : null))
  const wrapper = mount(
    defineComponent({
      setup: () => () => {
        const select = h(Select, {
          ...props,
          modelValue: model.value,
          'onUpdate:modelValue': (value: unknown) => {
            model.value = value
          },
        })
        return inForm ? h('form', {}, [select]) : select
      },
    }),
    { attachTo: document.body },
  )
  const select = wrapper.findComponent(Select)
  const open = async () => {
    await select.find('.vsk-trigger').trigger('click')
    await flushPromises()
  }
  return { wrapper, select, model, open }
}

describe('review regressions', () => {
  it('keeps the first pointer click open after focus opens the control', async () => {
    const { wrapper } = setup({ options: ['One'], openOnFocus: true })
    const trigger = wrapper.find('.vsk-trigger')
    await trigger.trigger('pointerdown')
    ;(trigger.element as HTMLButtonElement).focus()
    await nextTick()
    trigger.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await nextTick()
    expect(wrapper.find('[role=listbox]').exists()).toBe(true)
    await trigger.trigger('pointerdown')
    trigger.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await nextTick()
    expect(wrapper.find('[role=listbox]').exists()).toBe(false)
  })

  it('invalidates pending creation when a form is reset, including without a name', async () => {
    const request = deferred<string>()
    let signal!: AbortSignal
    const { wrapper, model, select, open } = setup(
      {
        options: ['One'],
        modelValue: 'One',
        searchable: true,
        createOption: (_q: string, context: { signal: AbortSignal }) => {
          signal = context.signal
          return request.promise
        },
      },
      true,
    )
    await open()
    await select.find('.vsk-search').setValue('New')
    await select.find('.vsk-create').trigger('click')
    ;(wrapper.element as HTMLFormElement).reset()
    await flushPromises()
    expect(signal.aborted).toBe(true)
    request.resolve('New')
    await flushPromises()
    expect(model.value).toBe('One')
    expect(select.emitted('create')).toBeUndefined()
  })

  it('does not unlock a newer creation when an aborted request settles', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const creator = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const wrapper = mount(Select, {
      props: { options: [], searchable: true, createOption: creator },
      attachTo: document.body,
    })
    await wrapper.find('.vsk-trigger').trigger('click')
    await wrapper.find('.vsk-search').setValue('First')
    await wrapper.find('.vsk-create').trigger('click')
    await wrapper.setProps({ disabled: true })
    await wrapper.setProps({ disabled: false })
    await wrapper.find('.vsk-trigger').trigger('click')
    await wrapper.find('.vsk-search').setValue('Second')
    await wrapper.find('.vsk-create').trigger('click')
    first.resolve('First')
    await flushPromises()
    expect(wrapper.find('.vsk-create').attributes('aria-disabled')).toBe('true')
    await wrapper.find('.vsk-create').trigger('click')
    expect(creator).toHaveBeenCalledTimes(2)
    second.resolve('Second')
    await flushPromises()
    expect(wrapper.emitted('create')).toEqual([['Second']])
  })

  it('rebinds reset to a changed external form and detaches the old listener', async () => {
    const host = mount(
      defineComponent({
        setup: () => () => h('div', [h('form', { id: 'old-form' }), h('form', { id: 'new-form' })]),
      }),
      { attachTo: document.body },
    )
    const select = mount(Select, {
      props: { options: ['One', 'Two'], form: 'old-form' },
      attachTo: document.body,
    })
    await select.setProps({ form: 'new-form' })
    await select.find('.vsk-trigger').trigger('click')
    await select.findAll('[role=option]')[1]!.trigger('click')
    ;(host.find('#old-form').element as HTMLFormElement).reset()
    await flushPromises()
    expect(select.find('.vsk-selection').text()).toBe('Two')
    ;(host.find('#new-form').element as HTMLFormElement).reset()
    await flushPromises()
    expect(select.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })
})

describe('paged remote loading', () => {
  it('appends pages, deduplicates keys and selects across all loaded pages', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ options: ['One', 'Two'], nextCursor: 0 })
      .mockResolvedValueOnce({ options: ['Two', 'Three'], nextCursor: null })
    const { wrapper, model, open } = setup({
      multiple: true,
      showSelectAll: true,
      loadOptions: loader,
    })
    await open()
    await wrapper.find('.vsk-load-more').trigger('click')
    await flushPromises()
    expect(loader.mock.calls[1]![1].cursor).toBe(0)
    expect(wrapper.findAll('[role=option]').map((o) => o.text())).toEqual(['One', 'Two', 'Three'])
    expect(wrapper.find('.vsk-load-more').exists()).toBe(false)
    await wrapper.find('[role=checkbox]').trigger('click')
    expect(model.value).toEqual(['One', 'Two', 'Three'])
  })

  it('retries a failed page with the same cursor without losing previous pages', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ options: ['One'], nextCursor: 'next' })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ options: ['Two'] })
    const { wrapper, open } = setup({ loadOptions: loader })
    await open()
    await wrapper.find('.vsk-load-more').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role=option]').text()).toBe('One')
    await wrapper.find('[role=alert] button').trigger('click')
    await flushPromises()
    expect(loader.mock.calls[2]![1].cursor).toBe('next')
    expect(wrapper.findAll('[role=option]')).toHaveLength(2)
  })

  it('ignores a late page after a query change and clears its cursor', async () => {
    const latePage = deferred<{ options: string[]; nextCursor: string }>()
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ options: ['Old'], nextCursor: 'page2' })
      .mockReturnValueOnce(latePage.promise)
      .mockResolvedValueOnce({ options: ['New'] })
    const { wrapper, open } = setup({ loadOptions: loader, searchable: true, debounce: 0 })
    await open()
    await wrapper.find('.vsk-load-more').trigger('click')
    await wrapper.find('.vsk-search').setValue('new')
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()
    latePage.resolve({ options: ['Stale'], nextCursor: 'page3' })
    await flushPromises()
    expect(wrapper.find('[role=option]').text()).toBe('New')
    expect(wrapper.find('.vsk-load-more').exists()).toBe(false)
    expect(loader.mock.calls[2]![1].cursor).toBeUndefined()
  })

  it('loads more at the scroll boundary without issuing overlapping requests', async () => {
    const page = deferred<{ options: string[] }>()
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ options: ['One'], nextCursor: 1 })
      .mockReturnValueOnce(page.promise)
    const { wrapper, open } = setup({ loadOptions: loader })
    await open()
    const list = wrapper.find('[role=listbox]')
    await list.trigger('scroll')
    await list.trigger('scroll')
    expect(loader).toHaveBeenCalledTimes(2)
    page.resolve({ options: ['Two'] })
    await flushPromises()
    expect(wrapper.findAll('[role=option]')).toHaveLength(2)
  })
})

describe('selected record resolution', () => {
  const records = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ]
  it('resolves saved IDs before opening without changing or emitting the model', async () => {
    const resolver = vi.fn().mockResolvedValue(records)
    const { wrapper, select, model } = setup({
      modelValue: [1, 2],
      multiple: true,
      valueKey: 'id',
      optionKey: 'id',
      labelKey: 'name',
      resolveOptions: resolver,
    })
    await flushPromises()
    expect(resolver.mock.calls[0]![0]).toEqual([1, 2])
    expect(wrapper.find('.vsk-selection').text()).toContain('Ada')
    expect(wrapper.find('.vsk-selection').text()).toContain('Grace')
    expect(model.value).toEqual([1, 2])
    expect(select.emitted('update:modelValue')).toBeUndefined()
    expect(select.emitted('change')).toBeUndefined()
  })

  it('cancels stale resolution and keeps the latest selected label', async () => {
    const old = deferred<typeof records>()
    const resolver = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce([records[1]])
    const { wrapper, model } = setup({
      modelValue: 1,
      valueKey: 'id',
      optionKey: 'id',
      labelKey: 'name',
      resolveOptions: resolver,
    })
    await flushPromises()
    model.value = 2
    await flushPromises()
    old.resolve([records[0]!])
    await flushPromises()
    expect(resolver.mock.calls[0]![1].signal.aborted).toBe(true)
    expect(wrapper.find('.vsk-selection').text()).toBe('Grace')
  })

  it('offers retry for resolution failures and aborts on unmount', async () => {
    const resolver = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([records[0]])
    const { wrapper, select, open } = setup({
      modelValue: 1,
      valueKey: 'id',
      optionKey: 'id',
      labelKey: 'name',
      resolveOptions: resolver,
    })
    await flushPromises()
    expect(select.emitted('resolve-error')).toHaveLength(1)
    await open()
    await wrapper.find('[role=alert] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.vsk-selection').text()).toBe('Ada')
    const pendingResolver = vi.fn(() => new Promise<unknown[]>(() => {}))
    const other = setup({ modelValue: 5, resolveOptions: pendingResolver })
    await flushPromises()
    other.wrapper.unmount()
    expect(pendingResolver.mock.calls[0]?.[1].signal.aborted).toBe(true)
  })
})

describe('selection display and read-only mode', () => {
  it('limits visible tags without truncating submission, and localizes the summary and announcement', async () => {
    const { wrapper, model, open } = setup(
      {
        options: ['One', 'Two', 'Three'],
        modelValue: ['One', 'Two'],
        multiple: true,
        maxVisibleTags: 1,
        name: 'values',
        messages: {
          moreSelected: (n: number) => `${n} autres`,
          selectedCount: (n: number) => `${n} choisis`,
        },
      },
      true,
    )
    expect(wrapper.findAll('.vsk-tag')).toHaveLength(1)
    expect(wrapper.find('.vsk-tag-overflow').text()).toBe('1 autres')
    expect(new FormData(wrapper.element as HTMLFormElement).getAll('values')).toEqual([
      'One',
      'Two',
    ])
    await open()
    await wrapper.findAll('[role=option]')[2]!.trigger('click')
    expect(model.value).toEqual(['One', 'Two', 'Three'])
    expect(wrapper.find('.vsk-sr-only[role=status]').text()).toBe('3 choisis')
  })

  it('supports zero visible tags and a typed overflow slot', () => {
    const wrapper = mount(Select, {
      props: {
        options: ['One', 'Two'],
        modelValue: ['One', 'Two'],
        multiple: true,
        maxVisibleTags: 0,
      },
      slots: { 'tag-overflow': ({ count, values }) => `${count}: ${values.join(',')}` },
    })
    expect(wrapper.findAll('.vsk-tag')).toHaveLength(0)
    expect(wrapper.find('.vsk-tag-overflow').text()).toBe('2: One,Two')
  })

  it('allows focus, search and submission in read-only mode, while blocking every selection action', async () => {
    const { wrapper, select, model, open } = setup(
      {
        options: ['One', 'Two'],
        modelValue: ['One'],
        name: 'values',
        multiple: true,
        readonly: true,
        searchable: true,
        showSelectAll: true,
        createOption: (q: string) => q,
      },
      true,
    )
    await open()
    expect(document.activeElement).toBe(wrapper.find('.vsk-search').element)
    await wrapper.findAll('[role=option]')[1]!.trigger('click')
    await wrapper.find('.vsk-clear').trigger('click')
    await wrapper.find('.vsk-tag button').trigger('click')
    await wrapper.find('[role=checkbox]').trigger('click')
    await wrapper.find('.vsk-search').setValue('New')
    expect(wrapper.find('.vsk-create').attributes('disabled')).toBeDefined()
    expect(model.value).toEqual(['One'])
    expect(select.emitted('change')).toBeUndefined()
    expect(new FormData(wrapper.element as HTMLFormElement).getAll('values')).toEqual(['One'])
  })
})

describe('group selection', () => {
  const records = [
    { id: 1, name: 'One', group: 'A' },
    { id: 2, name: 'Two', group: 'B' },
    { id: 3, name: 'Three', group: 'A' },
    { id: 4, name: 'Disabled', group: 'A', disabled: true },
  ]
  it.each([false, true])(
    'toggles enabled groups independently of virtual rows (virtual=%s)',
    async (virtual) => {
      const { wrapper, select, model, open } = setup({
        options: records,
        modelValue: [2],
        multiple: true,
        valueKey: 'id',
        optionKey: 'id',
        labelKey: 'name',
        groupBy: 'group',
        showGroupSelect: true,
        virtual,
      })
      await open()
      await wrapper.find('[aria-label="Select group A"]').trigger('click')
      expect(model.value).toEqual([2, 1, 3])
      expect(select.emitted('change')).toHaveLength(1)
      expect(select.emitted('change')![0]![1]).toMatchObject({ reason: 'select-group' })
      await wrapper.find('[aria-label="Select group A"]').trigger('click')
      expect(model.value).toEqual([2])
      expect(select.emitted('change')![1]![1]).toMatchObject({ reason: 'deselect-group' })
    },
  )

  it('respects search and selection limits for group actions', async () => {
    const { wrapper, model, open } = setup({
      options: records,
      multiple: true,
      maxSelected: 1,
      searchable: true,
      valueKey: 'id',
      optionKey: 'id',
      labelKey: 'name',
      groupBy: 'group',
      showGroupSelect: true,
    })
    await open()
    expect(wrapper.find('[aria-label="Select group A"]').attributes('disabled')).toBeDefined()
    await wrapper.find('.vsk-search').setValue('One')
    await wrapper.find('[aria-label="Select group A"]').trigger('click')
    expect(model.value).toEqual([1])
  })
})
