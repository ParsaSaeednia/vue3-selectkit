# Events

Observe user actions without confusing them with external model synchronization.

`v-model` uses the `modelValue` prop and `update:modelValue` event. Version 1.0.0 implements this binding with Vue's `defineModel()` macro; existing event listeners remain supported.

`update:modelValue` reports model changes. `change(value, detail)` describes each committed selection action, including a reset to the current value. External model updates emit neither event.

<ApiReference kind="events" />
