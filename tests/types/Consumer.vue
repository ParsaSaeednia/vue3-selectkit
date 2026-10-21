<script setup lang="ts">
import { ref } from 'vue'
import { VueMultiselect, type ChangeDetail, type OptionSlot } from 'vue3-selectkit'
interface User {
  id: number
  name: string
}
const users: User[] = [{ id: 1, name: 'Ada' }]
const object = ref<User | null>(null)
const id = ref<number | null>(null)
const ids = ref<number[]>([])
const projectUser = (o: User) => ({ key: o.id })
const projected = ref<{ key: number } | null>(null)
const wrong = ref<string | null>(null)
const wrongMany = ref<string[]>([])
function changed(value: number | null, detail: ChangeDetail<User>) {
  console.log(value, detail.options[0]?.id)
}
const slot = {} as OptionSlot<User, User>
// @ts-expect-error Unknown typed slot field
slot.option.missing
function wrongHandler(value: string) {
  console.log(value)
}
</script>
<template>
  <VueMultiselect v-model="object" :options="users" option-key="id" label-key="name"
    ><template #single-value="{ option }">{{ option.name }}</template></VueMultiselect
  >
  <VueMultiselect v-model="id" :options="users" value-key="id" option-key="id" @change="changed" />
  <VueMultiselect v-model="ids" :options="users" value-key="id" option-key="id" multiple />
  <VueMultiselect
    v-model="projected"
    :options="users"
    option-key="id"
    :get-option-value="projectUser"
    :is-value-equal="(a, b) => a.key === b.key"
  />
  <VueMultiselect
    v-model="projected"
    :options="users"
    option-key="id"
    :get-option-value="(o: User) => ({ key: o.id })"
  />
  <!-- @vue-expect-error Objects require object models without a projection -->
  <VueMultiselect v-model="wrong" :options="users" />
  <!-- @vue-expect-error A projection must match its model -->
  <VueMultiselect v-model="id" :options="users" :get-option-value="projectUser" />
  <!-- @vue-expect-error Wrong field model -->
  <VueMultiselect v-model="wrong" :options="users" value-key="id" />
  <!-- @vue-expect-error Wrong array value -->
  <VueMultiselect v-model="wrongMany" :options="users" value-key="id" multiple />
  <!-- @vue-expect-error Unknown option key -->
  <VueMultiselect :options="users" label-key="missing" />
  <!-- @vue-expect-error Wrong change event payload -->
  <VueMultiselect :options="users" value-key="id" @change="wrongHandler" />
  <VueMultiselect :options="users"
    ><template #option="{ option }">{{ option.name }}</template></VueMultiselect
  >
</template>
