<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueMultiselect } from '../../packages/selectkit/src'
import '../../packages/selectkit/src/style.css'

const params = new URLSearchParams(location.search)
const teleport = ref(
  params.get('teleport') === 'body'
    ? true
    : params.get('teleport') === 'target'
      ? '#target'
      : false,
)
const placement = (params.get('placement') ?? 'auto') as 'auto' | 'top' | 'bottom'
const dir = params.has('rtl') ? 'rtl' : 'ltr'
const virtual = params.has('virtual')
const grouped = params.has('groups')
const tall = ref(params.has('tall'))
const count = ref(10000)
const selected = ref<number[]>([])
const options = computed(() =>
  Array.from({ length: count.value }, (_, index) => ({
    id: index,
    name: `Option ${index}`,
    group: `Group ${Math.floor(index / 100)}`,
  })),
)
</script>

<template>
  <header>
    <label><input v-model="tall" type="checkbox" />Tall rows</label>
    <select v-model="teleport" aria-label="Teleport target">
      <option :value="false">Inline</option>
      <option :value="true">Body</option>
      <option value="#target">Transformed target</option>
    </select>
    <button @click="count = count === 10000 ? 3 : 10000">Change option count</button>
    <output>{{ selected }}</output>
  </header>
  <div id="target"></div>
  <div id="scroller" :style="{ transform: params.has('scale') ? 'scale(.85)' : undefined }">
    <div class="content">
      <div id="anchor" :style="{ top: `${Number(params.get('top') ?? 60)}px` }">
        <VueMultiselect
          v-model="selected"
          :options="options"
          option-key="id"
          label-key="name"
          value-key="id"
          label="Test options"
          multiple
          searchable
          :virtual="virtual"
          :group-by="grouped ? 'group' : undefined"
          :teleport="teleport"
          :placement="placement"
          :dir="dir"
        >
          <template #option="{ option }">
            <span :style="{ height: tall ? `${40.5 + (option.id % 3) * 20}px` : undefined }">{{
              option.name
            }}</span>
          </template>
        </VueMultiselect>
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 24px;
  font: 14px sans-serif;
}
header {
  height: 44px;
  display: flex;
  gap: 16px;
  align-items: center;
}
#scroller {
  width: 580px;
  height: 360px;
  overflow: auto;
  position: relative;
  border: 8px solid #eee;
  transform-origin: top left;
}
.content {
  position: relative;
  width: 800px;
  height: 1200px;
}
#anchor {
  position: absolute;
  left: 90px;
  width: 240px;
}
#target {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  transform: translate(30px, 20px) scale(0.9);
  transform-origin: top left;
  pointer-events: none;
}
#target .vsk-dropdown {
  pointer-events: auto;
}
</style>
