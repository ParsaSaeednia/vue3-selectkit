import { computed, onBeforeUnmount, shallowRef, watch, type Ref } from 'vue'
import type { LoadOptionsContext, OptionKey, OptionsPage } from '../types'
import { useAsyncTask } from './useAsyncTask'

export function useRemoteOptions<T>(config: {
  loader: () =>
    | ((query: string, context: LoadOptionsContext) => Promise<readonly T[] | OptionsPage<T>>)
    | undefined
  query: Ref<string>
  opened: Ref<boolean>
  disabled: () => boolean | undefined
  debounce: () => number | undefined
  minSearchLength: () => number | undefined
  onSearch: (query: string) => void
  onError: (error: unknown) => void
}) {
  const remote = shallowRef<readonly T[]>()
  const cursor = shallowRef<OptionKey | null>()
  const task = useAsyncTask(config.onError)
  let timer: ReturnType<typeof setTimeout> | undefined
  let failedAppend = false
  const hasMore = computed(() => cursor.value != null)

  function cancel() {
    clearTimeout(timer)
    task.abort()
  }

  async function fetch(append = false) {
    const loader = config.loader()
    if (
      !loader ||
      config.disabled() ||
      !config.opened.value ||
      (append && (!hasMore.value || task.pending.value))
    )
      return
    clearTimeout(timer)
    if (config.query.value.length < (config.minSearchLength() ?? 0)) {
      cancel()
      remote.value = []
      cursor.value = undefined
      task.error.value = undefined
      return
    }
    failedAppend = append
    const query = config.query.value
    const requestedCursor = append ? cursor.value! : undefined
    await task.run(
      (signal) => loader(query, { signal, cursor: requestedCursor }),
      (result) => {
        const page = Array.isArray(result)
          ? { options: result, nextCursor: undefined }
          : (result as OptionsPage<T>)
        remote.value = append ? [...(remote.value ?? []), ...page.options] : page.options
        // A repeated cursor must not create an endless scroll/request loop.
        cursor.value = page.nextCursor === requestedCursor ? undefined : page.nextCursor
      },
    )
  }

  const refresh = () => fetch()
  const loadMore = () => fetch(true)
  const retry = () => fetch(failedAppend)
  watch(config.query, (query) => {
    config.onSearch(query)
    cancel()
    cursor.value = undefined
    task.error.value = undefined
    if (config.loader()) remote.value = []
    if (config.opened.value && config.loader())
      timer = setTimeout(refresh, config.debounce() ?? 250)
  })
  watch(config.loader, (loader) => {
    cancel()
    cursor.value = undefined
    remote.value = undefined
    task.error.value = undefined
    if (config.opened.value && loader) void refresh()
  })
  onBeforeUnmount(cancel)
  return {
    remote,
    hasMore,
    loading: task.pending,
    error: task.error,
    refresh,
    loadMore,
    retry,
    cancel,
  }
}
