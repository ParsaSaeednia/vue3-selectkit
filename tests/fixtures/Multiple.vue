<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect } from '../../packages/selectkit/src'
const people = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]
const shorthand = ref<number[]>([1])
const empty = ref<number[]>([1])
const explicit = ref<number[]>([1])
const single = ref<number | null>(1)
const omitted = ref<number | null>(1)
const dynamic = ref(true)
const dynamicValue = ref<number | number[] | null>([1])
function switchMode() {
  dynamic.value = !dynamic.value
  dynamicValue.value = dynamic.value ? [1] : 1
}
</script>
<template>
  <form>
    <section data-mode="shorthand">
      <VueMultiselect
        v-model="shorthand"
        :options="people"
        option-key="id"
        label-key="name"
        value-key="id"
        label="Shorthand"
        name="shorthand"
        multiple
      />
      <pre>{{ JSON.stringify(shorthand) }}</pre>
    </section>
    <section data-mode="empty">
      <!-- @vue-expect-error Exercise runtime empty-attribute casting; typed callers use the shorthand or a boolean binding. -->
      <VueMultiselect
        v-model="empty"
        :options="people"
        option-key="id"
        label-key="name"
        value-key="id"
        label="Empty"
        name="empty"
        multiple=""
      />
      <pre>{{ JSON.stringify(empty) }}</pre>
    </section>
    <section data-mode="true">
      <VueMultiselect
        v-model="explicit"
        :options="people"
        option-key="id"
        label-key="name"
        value-key="id"
        label="Explicit"
        name="true"
        :multiple="true"
      />
      <pre>{{ JSON.stringify(explicit) }}</pre>
    </section>
    <section data-mode="false">
      <VueMultiselect
        v-model="single"
        :options="people"
        option-key="id"
        label-key="name"
        value-key="id"
        label="Single"
        name="false"
        :multiple="false"
      />
      <pre>{{ JSON.stringify(single) }}</pre>
    </section>
    <section data-mode="omitted">
      <VueMultiselect
        v-model="omitted"
        :options="people"
        option-key="id"
        label-key="name"
        value-key="id"
        label="Omitted"
        name="omitted"
      />
      <pre>{{ JSON.stringify(omitted) }}</pre>
    </section>
    <section data-mode="dynamic">
      <VueMultiselect
        v-model="dynamicValue"
        :options="people"
        option-key="id"
        label-key="name"
        value-key="id"
        label="Dynamic"
        name="dynamic"
        :multiple="dynamic"
      />
      <pre>{{ JSON.stringify(dynamicValue) }}</pre>
      <button type="button" @click="switchMode">Switch mode</button>
    </section>
  </form>
</template>
