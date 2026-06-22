<template>
  <div class="color-picker" ref="pickerRef">
    <div class="color-preview" :style="{ background: hexColor }" @click="open = !open" />
    <input v-model="hexInput" @input="onHexInput" placeholder="#5865F2" class="hex-input" maxlength="7" />
    <button @click="clear" class="clear-btn" title="Reset color">✕</button>
    <div v-if="open" class="palette">
      <div v-for="c in DISCORD_COLORS" :key="c" class="swatch"
        :style="{ background: c }"
        :title="c"
        @click="selectColor(c)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()

const open = ref(false)
const pickerRef = ref<HTMLElement>()

onClickOutside(pickerRef, () => { open.value = false })

const DISCORD_COLORS = [
  '#1abc9c','#2ecc71','#3498db','#9b59b6','#e91e63',
  '#f1c40f','#e67e22','#e74c3c','#95a5a6','#607d8b',
  '#11806a','#1f8b4c','#206694','#71368a','#ad1457',
  '#c27c0e','#a84300','#992d22','#979c9f','#546e7a',
  '#5865f2','#eb459e','#fee75c','#57f287','#ed4245',
  '#ffffff','#99aab5','#2f3136','#202225','#000000',
]

const hexColor = computed(() => {
  if (props.modelValue == null) return '#4f545c'
  return '#' + props.modelValue.toString(16).padStart(6, '0')
})

const hexInput = ref(hexColor.value)

watch(() => props.modelValue, (v) => {
  hexInput.value = v == null ? '' : '#' + v.toString(16).padStart(6, '0')
})

function onHexInput() {
  const raw = hexInput.value.replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    emit('update:modelValue', parseInt(raw, 16))
  }
}

function selectColor(c: string) {
  hexInput.value = c
  emit('update:modelValue', parseInt(c.slice(1), 16))
  open.value = false
}

function clear() {
  hexInput.value = ''
  emit('update:modelValue', null)
}
</script>

<style scoped>
.color-picker { display: flex; align-items: center; gap: 8px; position: relative; }
.color-preview { width: 36px; height: 36px; border-radius: 6px; cursor: pointer; border: 2px solid #40444b; flex-shrink: 0; transition: transform 0.1s; }
.color-preview:hover { transform: scale(1.1); }
.hex-input { background: #202225; color: #dcddde; border: 1px solid #40444b; border-radius: 4px; padding: 6px 10px; width: 96px; font-family: monospace; }
.clear-btn { background: none; border: none; color: #72767d; cursor: pointer; font-size: 14px; padding: 4px; }
.clear-btn:hover { color: #ed4245; }
.palette {
  position: absolute;
  top: 44px;
  left: 0;
  background: #2f3136;
  border: 1px solid #40444b;
  border-radius: 8px;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(10, 26px);
  gap: 4px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(0,0,0,.4);
}
.swatch { width: 26px; height: 26px; border-radius: 4px; cursor: pointer; transition: transform 0.1s; }
.swatch:hover { transform: scale(1.25); }
</style>
