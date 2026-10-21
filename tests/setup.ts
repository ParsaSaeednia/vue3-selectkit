import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
enableAutoUnmount(afterEach)
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
