import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

export function useFormReset(
  select: Ref<HTMLSelectElement | undefined>,
  reset: (event: Event) => void,
) {
  let owner: HTMLFormElement | null = null
  let observer: MutationObserver | undefined
  function bind() {
    const next = select.value?.form ?? null
    if (next === owner) return
    owner?.removeEventListener('reset', reset)
    owner = next
    owner?.addEventListener('reset', reset)
  }
  // Covers changed form attributes, reparenting, and forms inserted after mount.
  onMounted(() => {
    bind()
    observer = new MutationObserver(bind)
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'form'],
    })
  })
  watch(select, bind, { flush: 'post' })
  onBeforeUnmount(() => {
    observer?.disconnect()
    owner?.removeEventListener('reset', reset)
  })
}
