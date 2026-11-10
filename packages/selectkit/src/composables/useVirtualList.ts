import { computed, nextTick, shallowRef, watch, type Ref } from 'vue'

interface VirtualListOptions<T> {
  rows: Readonly<Ref<readonly T[]>>
  element: Ref<HTMLElement | undefined>
  activeIndex: Readonly<Ref<number>>
  enabled: () => boolean
  key: (row: T) => string
  estimate: (row: T) => number
}

export function useVirtualList<T>(options: VirtualListOptions<T>) {
  const measurements = new Map<string, number>()
  const revision = shallowRef(0)
  const scrollTop = shallowRef(0)
  const viewportHeight = shallowRef(0)
  let observer: ResizeObserver | undefined
  const elements = new Set<HTMLElement>()
  let scrollTarget: number | undefined

  const offsets = computed(() => {
    revision.value
    const result = [0]
    for (const row of options.rows.value) {
      const height = measurements.get(options.key(row)) ?? options.estimate(row)
      result.push(result[result.length - 1]! + Math.max(1, height))
    }
    return result
  })
  const totalSize = computed(() => offsets.value[offsets.value.length - 1]!)
  // Find the first row whose bottom is below an offset, including at list boundaries.
  function indexAt(offset: number) {
    const positions = offsets.value
    let low = 0
    let high = positions.length - 2
    while (low < high) {
      const mid = (low + high) >>> 1
      if (positions[mid + 1]! <= offset) low = mid + 1
      else high = mid
    }
    return low
  }
  const items = computed(() => {
    const count = options.rows.value.length
    if (!options.enabled() || !count) return []
    const start = Math.max(0, indexAt(scrollTop.value) - 5)
    const end = Math.min(count - 1, indexAt(scrollTop.value + viewportHeight.value) + 5)
    const indices = new Set<number>()
    for (let index = start; index <= end; index++) indices.add(index)
    // Keep aria-activedescendant valid even when the pointer scrolls away from it.
    const active = options.activeIndex.value
    if (active >= 0 && active < count) indices.add(active)
    return [...indices]
      .sort((a, b) => a - b)
      .map((index) => ({ index, start: offsets.value[index]! }))
  })

  function readScroll() {
    const element = options.element.value
    if (!element) return
    scrollTop.value = element.scrollTop
    viewportHeight.value = element.clientHeight
  }
  function reveal(index: number) {
    const element = options.element.value
    if (!element || !options.enabled() || index < 0 || index >= options.rows.value.length) return
    const start = offsets.value[index]!
    const end = offsets.value[index + 1]!
    const top = element.scrollTop
    const height = element.clientHeight
    let next = top
    if (start < top || end - start > height) next = start
    else if (end > top + height) next = end - height
    element.scrollTop = Math.max(0, Math.min(next, totalSize.value - height))
    readScroll()
  }
  function scrollToIndex(index: number) {
    scrollTarget = index
    reveal(index)
    // The destination's real height is known only after its rows have mounted.
    void nextTick(() => {
      if (scrollTarget === index) reveal(index)
      scrollTarget = undefined
    })
  }
  function measureRow(element: unknown, observedHeight?: number) {
    if (
      !(element instanceof HTMLElement) ||
      !options.enabled() ||
      !options.element.value?.contains(element)
    )
      return
    const index = Number(element.dataset.index)
    const row = options.rows.value[index]
    if (!row) return
    if (observedHeight === undefined && elements.has(element)) return
    if (!elements.has(element)) {
      elements.add(element)
      observer?.observe(element)
    }
    // Both sizes are in local CSS pixels, even inside a scaled ancestor.
    const size = observedHeight ?? element.offsetHeight
    if (!size) return
    const key = options.key(row)
    const previous = measurements.get(key) ?? options.estimate(row)
    if (Math.abs(previous - size) < 0.5) return
    // Preserve the visible scroll anchor when already measured rows above it resize.
    const delta = size - previous
    if (offsets.value[index + 1]! <= scrollTop.value && scrollTarget === undefined) {
      const list = options.element.value
      if (list) list.scrollTop += delta
      readScroll()
    }
    measurements.set(key, size)
    revision.value++
  }
  function measure(element: unknown) {
    measureRow(element)
  }
  watch(options.rows, (rows) => {
    const keys = new Set(rows.map(options.key))
    for (const key of measurements.keys()) if (!keys.has(key)) measurements.delete(key)
    scrollTarget = undefined
    // Filtering or shrinking a list must not leave its viewport beyond the last row.
    void nextTick(readScroll)
  })
  watch(
    [options.element, options.enabled],
    ([element, enabled], _, cleanup) => {
      if (!element || !enabled) return
      readScroll()
      let width = element.clientWidth
      let frame: number | undefined
      const pending = new Map<Element, number | undefined>()
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) pending.set(entry.target, entry.borderBoxSize?.[0]?.blockSize)
        if (frame !== undefined) return
        frame = requestAnimationFrame(() => {
          frame = undefined
          for (const [target, height] of pending) {
            if (target === element) {
              if (width !== element.clientWidth) {
                width = element.clientWidth
                measurements.clear()
                revision.value++
                for (const row of elements) measureRow(row, row.offsetHeight)
              }
              readScroll()
            } else measureRow(target, height)
          }
          pending.clear()
        })
      })
      observer.observe(element)
      for (const row of elements) observer.observe(row)
      const onScroll = () => {
        scrollTarget = undefined
        readScroll()
      }
      element.addEventListener('scroll', onScroll, { passive: true })
      cleanup(() => {
        observer?.disconnect()
        if (frame !== undefined) cancelAnimationFrame(frame)
        observer = undefined
        elements.clear()
        scrollTarget = undefined
        element.removeEventListener('scroll', onScroll)
      })
    },
    { flush: 'post' },
  )
  // Function refs receive null on removal, so prune the observed set after each patch.
  watch(items, () => {
    void nextTick(() => {
      for (const element of elements) {
        if (!options.element.value?.contains(element)) {
          observer?.unobserve(element)
          elements.delete(element)
        }
      }
    })
  })
  return { items, totalSize, measure, scrollToIndex }
}
