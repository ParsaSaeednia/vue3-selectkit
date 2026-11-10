import { shallowRef, watch, type CSSProperties, type Ref } from 'vue'

interface PositionOptions {
  control: Ref<HTMLElement | undefined>
  popup: Ref<HTMLElement | undefined>
  list: Ref<HTMLElement | undefined>
  placement: () => 'top' | 'bottom' | 'auto' | undefined
  teleport: () => boolean | string | undefined
  maxHeight: () => number
  direction: () => 'ltr' | 'rtl' | 'auto' | undefined
}

function parentElement(element: Element): HTMLElement | null {
  return (
    element.parentElement ??
    ((element.getRootNode() as ShadowRoot).host as HTMLElement | undefined) ??
    null
  )
}
function fixedContainer(element: HTMLElement) {
  for (let parent = parentElement(element); parent; parent = parentElement(parent)) {
    const style = getComputedStyle(parent)
    if (
      (style.transform && style.transform !== 'none') ||
      (style.perspective && style.perspective !== 'none') ||
      (style.filter && style.filter !== 'none') ||
      /transform|perspective|filter/.test(style.willChange) ||
      /paint|layout|strict|content/.test(style.contain)
    )
      return parent
  }
  return null
}

export function useDropdownPosition(options: PositionOptions) {
  const styles = shallowRef<CSSProperties>({ position: 'absolute', left: 0, top: 0 })
  const availableListHeight = shallowRef<number>()
  watch(
    [
      options.control,
      options.popup,
      options.list,
      options.placement,
      options.teleport,
      options.maxHeight,
      options.direction,
    ],
    ([control, popup, list], _, cleanup) => {
      if (!control || !popup || !list) {
        availableListHeight.value = undefined
        return
      }
      const fixed = !!options.teleport()
      const viewport = window.visualViewport
      function update() {
        if (!control || !popup || !list) return
        const container = fixed ? fixedContainer(popup) : (popup.offsetParent as HTMLElement | null)
        const reference = control.getBoundingClientRect()
        const bounds = {
          left: viewport?.offsetLeft ?? 0,
          top: viewport?.offsetTop ?? 0,
          right:
            (viewport?.offsetLeft ?? 0) +
            (viewport?.width ?? (document.documentElement.clientWidth || window.innerWidth)),
          bottom:
            (viewport?.offsetTop ?? 0) +
            (viewport?.height ?? (document.documentElement.clientHeight || window.innerHeight)),
        }
        // A non-teleported popup also has to fit its scrolling/clipping ancestors.
        for (let parent = parentElement(popup); parent; parent = parentElement(parent)) {
          if (parent === document.body || parent === document.documentElement) continue
          const style = getComputedStyle(parent)
          const rect = parent.getBoundingClientRect()
          const sx = parent.offsetWidth ? rect.width / parent.offsetWidth : 1
          const sy = parent.offsetHeight ? rect.height / parent.offsetHeight : 1
          if (/auto|scroll|hidden|clip/.test(style.overflowX)) {
            bounds.left = Math.max(bounds.left, rect.left + parent.clientLeft * sx)
            bounds.right = Math.min(
              bounds.right,
              rect.left + (parent.clientLeft + parent.clientWidth) * sx,
            )
          }
          if (/auto|scroll|hidden|clip/.test(style.overflowY)) {
            bounds.top = Math.max(bounds.top, rect.top + parent.clientTop * sy)
            bounds.bottom = Math.min(
              bounds.bottom,
              rect.top + (parent.clientTop + parent.clientHeight) * sy,
            )
          }
        }
        bounds.left += 8
        bounds.top += 8
        bounds.right -= 8
        bounds.bottom -= 8
        const rect = container?.getBoundingClientRect()
        const sx = rect && container?.offsetWidth ? rect.width / container.offsetWidth : 1
        const sy = rect && container?.offsetHeight ? rect.height / container.offsetHeight : 1
        const width = Math.max(0, Math.min(reference.width, bounds.right - bounds.left))
        popup.style.position = fixed ? 'fixed' : 'absolute'
        popup.style.width = `${width / sx}px`
        const chrome = popup.offsetHeight - list.offsetHeight
        const below = Math.max(0, bounds.bottom - reference.bottom - 4)
        const above = Math.max(0, reference.top - bounds.top - 4)
        const desired = (Math.min(list.scrollHeight, options.maxHeight()) + chrome) * sy
        const top =
          options.placement() === 'top' ||
          (options.placement() !== 'bottom' && below < desired && above > below)
        const space = top ? above : below
        const height = Math.max(0, Math.min(options.maxHeight(), space / sy - chrome))
        availableListHeight.value = height
        list.style.maxHeight = `${height}px`
        const rtl = getComputedStyle(popup).direction === 'rtl'
        const x = Math.max(
          bounds.left,
          Math.min(rtl ? reference.right - width : reference.left, bounds.right - width),
        )
        const y = top
          ? reference.top - 4 - popup.getBoundingClientRect().height
          : reference.bottom + 4
        // Convert viewport coordinates into the popup's actual containing block.
        const page =
          !fixed &&
          (!container ||
            container === document.documentElement ||
            (container === document.body && getComputedStyle(container).position === 'static'))
        styles.value = {
          position: fixed ? 'fixed' : 'absolute',
          width: `${width / sx}px`,
          left: `${page ? x + window.scrollX : rect && container ? (x - rect.left) / sx - container.clientLeft + container.scrollLeft : x}px`,
          top: `${page ? y + window.scrollY : rect && container ? (y - rect.top) / sy - container.clientTop + container.scrollTop : y}px`,
        }
      }
      update()
      // ResizeObserver callbacks run during layout. Defer writes to avoid resize loops.
      let dirty = false
      const observer = new ResizeObserver(() => {
        dirty = true
      })
      observer.observe(control)
      observer.observe(popup)
      observer.observe(list)
      for (let parent = parentElement(popup); parent; parent = parentElement(parent)) {
        if (parent !== document.body && parent !== document.documentElement)
          observer.observe(parent)
      }
      window.addEventListener('resize', update, { passive: true })
      window.addEventListener('scroll', update, { capture: true, passive: true })
      viewport?.addEventListener('resize', update)
      viewport?.addEventListener('scroll', update)
      // Follow layout shifts and transforms that do not resize either element.
      let previous = control.getBoundingClientRect()
      let frame: number
      function track() {
        const rect = control!.getBoundingClientRect()
        if (
          dirty ||
          rect.x !== previous.x ||
          rect.y !== previous.y ||
          rect.width !== previous.width ||
          rect.height !== previous.height
        ) {
          dirty = false
          previous = rect
          update()
        }
        frame = requestAnimationFrame(track)
      }
      frame = requestAnimationFrame(track)
      cleanup(() => {
        observer.disconnect()
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', update)
        window.removeEventListener('scroll', update, true)
        viewport?.removeEventListener('resize', update)
        viewport?.removeEventListener('scroll', update)
      })
    },
    { flush: 'post' },
  )
  return { floatingStyles: styles, availableListHeight }
}
