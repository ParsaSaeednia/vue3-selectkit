import { onBeforeUnmount, ref, shallowRef } from 'vue'

/** Only the current request may publish a result, error, or idle state. */
export function useAsyncTask(onError: (error: unknown) => void) {
  const pending = ref(false)
  const error = shallowRef<unknown>()
  let current: AbortController | undefined

  function abort() {
    current?.abort()
    current = undefined
    pending.value = false
  }

  async function run<R>(job: (signal: AbortSignal) => R | Promise<R>, accept: (result: R) => void) {
    abort()
    const controller = new AbortController()
    current = controller
    pending.value = true
    error.value = undefined
    try {
      const result = await job(controller.signal)
      if (current === controller && !controller.signal.aborted) accept(result)
    } catch (cause) {
      if (current === controller && !controller.signal.aborted) {
        error.value = cause
        onError(cause)
      }
    } finally {
      if (current === controller) {
        current = undefined
        pending.value = false
      }
    }
  }

  onBeforeUnmount(abort)
  return { pending, error, abort, run }
}
