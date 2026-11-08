<script setup lang="ts">
import { ref } from 'vue'
import {
  VueMultiselect,
  type AsyncContext,
  type LoadOptionsContext,
  type OptionsPage,
} from 'vue3-selectkit'
interface Person {
  id: number
  name: string
  team: string
  disabled?: boolean
}
const people: Person[] = [
  { id: 1, name: 'Ada', team: 'A' },
  { id: 2, name: 'Grace', team: 'A' },
  { id: 3, name: 'Linus', team: 'B' },
  { id: 4, name: 'Blocked', team: 'A', disabled: true },
]
const ids = ref<number[]>([1])
const explicit = ref<number[]>([1])
const single = ref<number | null>(1)
const omitted = ref<number | null>(1)
const dynamic = ref(true)
const dynamicValue = ref<number | number[] | null>([1])
const remoteIds = ref<number[]>([2])
const readonly = ref(false)
function switchMode() {
  dynamic.value = !dynamic.value
  dynamicValue.value = dynamic.value ? [1] : 1
}
async function loadPeople(
  query: string,
  { signal, cursor }: LoadOptionsContext,
): Promise<OptionsPage<Person>> {
  signal.throwIfAborted()
  const matches = people.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()))
  const start = Number(cursor ?? 0)
  return {
    options: matches.slice(start, start + 2),
    nextCursor: start + 2 < matches.length ? start + 2 : null,
  }
}
async function resolvePeople(
  values: readonly number[],
  { signal }: AsyncContext,
): Promise<Person[]> {
  signal.throwIfAborted()
  return people.filter((person) => values.includes(person.id))
}
function createPerson(name: string): Person {
  return { id: 99, name, team: 'Custom' }
}
</script>
<template>
  <main>
    <h1>Nuxt package compatibility</h1>
    <form>
      <section data-mode="shorthand">
        <VueMultiselect
          v-model="ids"
          :options="people"
          option-key="id"
          label-key="name"
          value-key="id"
          label="People"
          name="people"
          multiple
          searchable
          show-select-all
          group-by="team"
          show-group-select
          :max-visible-tags="1"
          :readonly="readonly"
        />
        <pre data-testid="ids">{{ JSON.stringify(ids) }}</pre>
      </section>
      <section data-mode="true">
        <VueMultiselect
          v-model="explicit"
          :options="people"
          option-key="id"
          label-key="name"
          value-key="id"
          label="Explicit multiple"
          name="explicit"
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
          label="Explicit single"
          name="single"
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
          label="Default single"
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
      <section data-mode="remote">
        <VueMultiselect
          v-model="remoteIds"
          :load-options="loadPeople"
          :resolve-options="resolvePeople"
          :create-option="createPerson"
          option-key="id"
          label-key="name"
          value-key="id"
          label="Remote people"
          name="remote"
          multiple
          searchable
          virtual
          teleport="#teleports"
        />
        <pre data-testid="remote-ids">{{ JSON.stringify(remoteIds) }}</pre>
      </section>
      <button type="button" @click="readonly = !readonly">Toggle read only</button>
      <button type="reset">Reset form</button>
    </form>
  </main>
</template>
