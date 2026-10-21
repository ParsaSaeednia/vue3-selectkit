<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { highlight } from './highlight'
import { VueMultiselect } from 'vue3-selectkit'
const props = withDefaults(defineProps<{ kind?: 'object' | 'id' | 'display' | 'rtl' }>(), {
  kind: 'object',
})
interface User {
  id: number
  name: string
  email: string
}
const users: User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
]
const selected = ref<User | null>(users[0]!)
const selectedId = ref<number | null>(1)
const cities = ['تهران', 'شیراز', 'اصفهان', 'تبریز']
const city = ref<string[]>(['تهران'])
const code = computed(() =>
  props.kind === 'rtl'
    ? `<VueMultiselect\n  v-model="cities"\n  :options="['تهران', 'شیراز', 'اصفهان']"\n  multiple searchable show-select-all\n  dir="rtl" label="شهرها"\n  :messages="{ search: 'جستجو...', selectAll: 'انتخاب همه' }"\n/>`
    : `<script setup lang="ts">\nimport { ref } from 'vue'\nimport { VueMultiselect } from 'vue3-selectkit'\nimport 'vue3-selectkit/style.css'\n\ninterface User { id: number; name: string; email: string }\nconst users: User[] = [\n  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },\n  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },\n]\nconst selected = ref<${props.kind === 'id' ? 'number' : 'User'} | null>(${props.kind === 'id' ? '1' : 'users[0]!'})\n<\/script>\n\n<template>\n<VueMultiselect\n  v-model="selected" :options="users"\n  option-key="id" label-key="name"${props.kind === 'id' ? '\n  value-key="id"' : ''}\n${props.kind === 'display' ? `>\n  <template #single-value="{ option }">\n    <span class="selected-user">\n      <strong>{{ option.name }}</strong>\n      <small>{{ option.email }}</small>\n    </span>\n  </template>\n</VueMultiselect>` : '/>'}\n</template>${props.kind === 'display' ? '\n\n<style scoped>\n.selected-user { display: flex; flex-direction: column; line-height: 1.3 }\n.selected-user small { color: #667085; font-size: 11px }\n</style>' : ''}`,
)
const originalCode = code
const displayCode = computed(() =>
  props.kind === 'id'
    ? `<VueMultiselect
  v-model="selected" :options="users"
  option-key="id" label-key="name"
  value-key="id"
/>`
    : props.kind === 'display'
      ? `<VueMultiselect
  v-model="selected" :options="users"
  option-key="id" label-key="name"
>
  <template #single-value="{ option }">
    <span style="display: grid">
      <strong>{{ option.name }}</strong>
      <small style="color: #667085">{{ option.email }}</small>
    </span>
  </template>
</VueMultiselect>`
      : originalCode.value,
)
const copied = ref(false)
async function copyDemo() {
  await navigator.clipboard.writeText(displayCode.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}
const highlighted = ref('')
watch(
  displayCode,
  async (value) => {
    highlighted.value = await highlight(value)
  },
  { immediate: true },
)
</script>
<template>
  <div class="guide-demo">
    <div class="guide-code">
      <button class="small-button guide-copy" @click="copyDemo">
        {{ copied ? 'Copied!' : 'Copy code' }}
      </button>
      <div v-html="highlighted"></div>
    </div>
    <div class="demo-preview">
      <span>Preview</span>
      <VueMultiselect
        v-if="kind === 'id'"
        v-model="selectedId"
        :options="users"
        option-key="id"
        label-key="name"
        value-key="id"
        aria-label="Select a user"
      />
      <VueMultiselect
        v-else-if="kind === 'rtl'"
        v-model="city"
        :options="cities"
        multiple
        searchable
        show-select-all
        dir="rtl"
        label="شهرها"
        :messages="{
          search: 'جستجو...',
          selectAll: 'انتخاب همه',
          clear: 'پاک کردن',
          remove: 'حذف',
          noResults: 'موردی یافت نشد',
        }"
      />
      <VueMultiselect
        v-else
        v-model="selected"
        :options="users"
        option-key="id"
        label-key="name"
        aria-label="Select a user"
        ><template v-if="kind === 'display'" #single-value="{ option }"
          ><span class="detail-value"
            ><strong>{{ option.name }}</strong
            ><small>{{ option.email }}</small></span
          ></template
        ></VueMultiselect
      >
      <pre v-if="kind === 'id'">v-model: {{ selectedId }}</pre>
    </div>
  </div>
</template>
