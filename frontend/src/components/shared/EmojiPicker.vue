<template>
  <div class="emoji-picker-wrapper" ref="wrapperRef">
    <button type="button" @click.stop="toggle" class="emoji-trigger-btn" title="Insérer un emoji">😀</button>
    <div v-if="open" class="emoji-panel" @click.stop>
      <div class="emoji-cats">
        <button
          v-for="cat in EMOJI_CATEGORIES"
          :key="cat.name"
          :class="['emoji-cat-btn', { active: activeCat === cat.name }]"
          @click="activeCat = cat.name"
          :title="cat.name"
        >{{ cat.icon }}</button>
      </div>
      <div class="emoji-cat-label">{{ activeCat }}</div>
      <div class="emoji-grid">
        <button
          v-for="emoji in currentEmojis"
          :key="emoji"
          class="emoji-btn"
          @click="select(emoji)"
        >{{ emoji }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { EMOJI_CATEGORIES } from '../../utils/emojis'

const emit = defineEmits<{ (e: 'select', emoji: string): void }>()

const open = ref(false)
const activeCat = ref(EMOJI_CATEGORIES[0].name)
const wrapperRef = ref<HTMLElement | null>(null)

const currentEmojis = computed(() =>
  EMOJI_CATEGORIES.find(c => c.name === activeCat.value)?.emojis ?? []
)

function toggle() {
  open.value = !open.value
}

function select(emoji: string) {
  emit('select', emoji)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick, true))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick, true))
</script>

<style scoped>
.emoji-picker-wrapper { position: relative; display: inline-block; }

.emoji-trigger-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.emoji-trigger-btn:hover { border-color: var(--accent); }

.emoji-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  width: 296px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
  z-index: 500;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.emoji-cats {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}

.emoji-cat-btn {
  background: none;
  border: none;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0.6;
  transition: all 0.12s;
}
.emoji-cat-btn:hover, .emoji-cat-btn.active { opacity: 1; background: var(--bg-tertiary); }
.emoji-cat-btn.active { background: rgba(88,101,242,.2); }

.emoji-cat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1px;
  max-height: 240px;
  overflow-y: auto;
}

.emoji-btn {
  background: none;
  border: none;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  text-align: center;
  transition: background 0.1s;
}
.emoji-btn:hover { background: var(--bg-tertiary); }
</style>
