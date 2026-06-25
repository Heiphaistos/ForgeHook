<template>
  <div class="emoji-picker-wrapper" ref="wrapperRef">
    <button type="button" @click.stop="toggle" class="emoji-trigger-btn" title="Insérer un emoji">😀</button>
    <div v-if="open" class="emoji-panel" @click.stop>
      <!-- Search -->
      <input v-model="searchQ" class="emoji-search" placeholder="🔍 Rechercher..." @click.stop />

      <!-- Category tabs (hidden during search) -->
      <div v-if="!searchQ" class="emoji-cats">
        <button
          v-if="recentEmojis.length"
          :class="['emoji-cat-btn', { active: activeCat === '__recent__' }]"
          @click="activeCat = '__recent__'"
          title="Récents">🕐</button>
        <button
          v-for="cat in EMOJI_CATEGORIES"
          :key="cat.name"
          :class="['emoji-cat-btn', { active: activeCat === cat.name }]"
          @click="activeCat = cat.name"
          :title="cat.name"
        >{{ cat.icon }}</button>
      </div>
      <div v-if="!searchQ" class="emoji-cat-label">
        {{ activeCat === '__recent__' ? 'Récents' : activeCat }}
      </div>

      <div class="emoji-grid">
        <template v-if="searchQ">
          <button
            v-for="emoji in searchResults"
            :key="emoji"
            class="emoji-btn"
            @click="select(emoji)"
          >{{ emoji }}</button>
          <div v-if="!searchResults.length" class="emoji-empty">Aucun résultat</div>
        </template>
        <template v-else>
          <button
            v-for="emoji in currentEmojis"
            :key="emoji"
            class="emoji-btn"
            @click="select(emoji)"
          >{{ emoji }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { EMOJI_CATEGORIES } from '../../utils/emojis'

const RECENT_KEY = 'fh_recent_emojis'
const MAX_RECENT = 32

const emit = defineEmits<{ (e: 'select', emoji: string): void }>()

const open = ref(false)
const activeCat = ref(EMOJI_CATEGORIES[0].name)
const wrapperRef = ref<HTMLElement | null>(null)
const searchQ = ref('')
const recentEmojis = ref<string[]>([])

function loadRecent() {
  try { recentEmojis.value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { recentEmojis.value = [] }
}

function saveRecent(emoji: string) {
  const list = [emoji, ...recentEmojis.value.filter(e => e !== emoji)].slice(0, MAX_RECENT)
  recentEmojis.value = list
  localStorage.setItem(RECENT_KEY, JSON.stringify(list))
}

const currentEmojis = computed(() => {
  if (activeCat.value === '__recent__') return recentEmojis.value
  return EMOJI_CATEGORIES.find(c => c.name === activeCat.value)?.emojis ?? []
})

const searchResults = computed(() => {
  const q = searchQ.value.toLowerCase().trim()
  if (!q) return []
  const hits: string[] = []
  for (const cat of EMOJI_CATEGORIES) {
    if (hits.length >= 64) break
    const catMatch = cat.name.toLowerCase().includes(q) || cat.keywords?.some(k => k.includes(q))
    if (catMatch) {
      for (const emoji of cat.emojis) {
        if (hits.length >= 64) break
        hits.push(emoji)
      }
    }
  }
  return hits
})

function toggle() {
  open.value = !open.value
  if (open.value) { loadRecent(); searchQ.value = '' }
}

function select(emoji: string) {
  saveRecent(emoji)
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

.emoji-search {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-size: 12px;
  padding: 5px 8px;
  box-sizing: border-box;
}
.emoji-search:focus { outline: none; border-color: var(--accent); }

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

.emoji-empty { font-size: 11px; color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 12px; }
</style>
