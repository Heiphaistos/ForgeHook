<template>
  <div class="page">
    <div class="page-header">
      <h1>😄 Emojis Discord</h1>
      <span class="emojis-count">{{ totalCount }} emojis compatibles Discord</span>
    </div>

    <!-- Barre d'outils -->
    <div class="emojis-toolbar">
      <input v-model="search" placeholder="🔍 Rechercher par catégorie..." class="fh-input search-input" />
      <div class="cat-nav">
        <button
          v-for="cat in EMOJI_CATEGORIES"
          :key="cat.name"
          :class="['cat-nav-btn', { active: !search && activeCat === cat.name }]"
          @click="selectCat(cat.name)"
          :title="cat.name"
        >{{ cat.icon }} <span>{{ cat.name }}</span></button>
      </div>
    </div>

    <!-- Toast copié -->
    <div v-if="copiedEmoji" class="copy-toast">✅ {{ copiedEmoji }} copié !</div>

    <!-- Affichage filtré (search) ou par catégorie sélectionnée -->
    <template v-if="search">
      <div class="category-group" v-for="cat in filteredCategories" :key="cat.name">
        <div class="category-label">{{ cat.icon }} {{ cat.name }} — {{ cat.emojis.length }}</div>
        <div class="emoji-catalog-grid">
          <button
            v-for="emoji in cat.emojis"
            :key="emoji"
            class="catalog-emoji-btn"
            @click="copyEmoji(emoji)"
            :title="`Cliquer pour copier ${emoji}`"
          >{{ emoji }}</button>
        </div>
      </div>
      <div v-if="!filteredCategories.length" class="empty-state">Aucune catégorie trouvée.</div>
    </template>

    <template v-else>
      <div class="category-group" v-if="currentCategory">
        <div class="cat-header">
          <div class="category-label">{{ currentCategory.icon }} {{ currentCategory.name }}</div>
          <span class="cat-count">{{ currentCategory.emojis.length }} emojis</span>
        </div>
        <div class="emoji-catalog-grid">
          <button
            v-for="emoji in currentCategory.emojis"
            :key="emoji"
            class="catalog-emoji-btn"
            @click="copyEmoji(emoji)"
            :title="`Cliquer pour copier ${emoji}`"
          >{{ emoji }}</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { EMOJI_CATEGORIES } from '../utils/emojis'

const search = ref('')
const activeCat = ref(EMOJI_CATEGORIES[0].name)
const copiedEmoji = ref('')
let copyTimer: ReturnType<typeof setTimeout> | null = null

const totalCount = computed(() => EMOJI_CATEGORIES.reduce((sum, c) => sum + c.emojis.length, 0))

const currentCategory = computed(() =>
  EMOJI_CATEGORIES.find(c => c.name === activeCat.value)
)

const filteredCategories = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return []
  return EMOJI_CATEGORIES.filter(c => c.name.toLowerCase().includes(q))
})

function selectCat(name: string) {
  activeCat.value = name
  search.value = ''
}

function copyEmoji(emoji: string) {
  navigator.clipboard.writeText(emoji).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = emoji
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
  copiedEmoji.value = emoji
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copiedEmoji.value = '' }, 1500)
}
</script>

<style scoped>
.emojis-count { font-size: 13px; color: var(--text-muted); }

.emojis-toolbar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }

.search-input { max-width: 360px; }

.cat-nav {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cat-nav-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-muted);
  transition: all 0.12s;
  white-space: nowrap;
}
.cat-nav-btn:hover { border-color: var(--accent); color: var(--text-primary); }
.cat-nav-btn.active { border-color: var(--accent); background: rgba(88,101,242,.15); color: #fff; }
.cat-nav-btn span { font-size: 12px; }

.cat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.cat-count { font-size: 12px; color: var(--text-muted); }

.emoji-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 4px;
}

.catalog-emoji-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  text-align: center;
  transition: all 0.12s;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.catalog-emoji-btn:hover {
  background: rgba(88,101,242,.15);
  border-color: var(--accent);
  transform: scale(1.1);
}
.catalog-emoji-btn:active { transform: scale(0.95); }

.copy-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #57f287;
  color: #000;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  z-index: 999;
  pointer-events: none;
}

.empty-state { color: var(--text-muted); padding: 48px; text-align: center; }
</style>
