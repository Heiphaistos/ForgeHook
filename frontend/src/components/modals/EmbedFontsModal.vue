<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal fonts-modal">
      <div class="fonts-modal-header">
        <h3>🔤 Discord Fonts</h3>
        <button @click="$emit('update:modelValue', false)" class="close-btn">✕</button>
      </div>

      <div class="fonts-modal-controls">
        <div class="fonts-input-row">
          <textarea v-model="fontsInput" placeholder="Texte à convertir..." class="fh-textarea" rows="2" style="flex:1" autofocus />
          <div class="fonts-target-col">
            <label class="fh-label" style="font-size:11px">Insérer dans</label>
            <select v-model="fontsTargetField" class="fh-select">
              <option value="description">Description</option>
              <option value="title">Titre</option>
              <option value="content">Message (content)</option>
              <option value="footer">Footer</option>
              <option value="author">Auteur</option>
            </select>
          </div>
        </div>
        <div class="fonts-cats">
          <button v-for="cat in ['Tous', ...CATEGORIES]" :key="cat"
            :class="['font-cat-btn', fontsCat === cat ? 'active' : '']"
            @click="fontsCat = cat">{{ cat }}</button>
        </div>
      </div>

      <div class="fonts-modal-grid">
        <div v-for="font in filteredFonts" :key="font.name" class="font-mini-card" :class="{ copied: fontsCopied === font.name }">
          <div class="font-mini-preview">{{ fontsInput ? convertFont(fontsInput, font) : font.desc }}</div>
          <div class="font-mini-name">{{ font.name }}</div>
          <div class="font-mini-actions">
            <button @click="copyFont(font)" class="btn-icon" title="Copier">📋</button>
            <button @click="injectFont(font)" class="btn-icon inject" title="Insérer dans l'embed">⚡</button>
          </div>
        </div>
      </div>

      <p v-if="fontsToast" class="fonts-toast">{{ fontsToast }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FONT_LIST, CATEGORIES, convertFont } from '../../utils/discordFonts'

defineProps<{ modelValue: boolean }>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  inject: [text: string, field: string]
}>()

const fontsInput = ref('')
const fontsTargetField = ref('description')
const fontsCat = ref('Tous')
const fontsCopied = ref('')
const fontsToast = ref('')

const filteredFonts = computed(() =>
  fontsCat.value === 'Tous' ? FONT_LIST : FONT_LIST.filter(f => f.category === fontsCat.value)
)

function copyFont(font: typeof FONT_LIST[0]) {
  if (!fontsInput.value) return
  navigator.clipboard.writeText(convertFont(fontsInput.value, font))
  fontsCopied.value = font.name
  fontsToast.value = '✅ Copié !'
  setTimeout(() => { fontsCopied.value = ''; fontsToast.value = '' }, 2000)
}

function injectFont(font: typeof FONT_LIST[0]) {
  if (!fontsInput.value) return
  emit('inject', convertFont(fontsInput.value, font), fontsTargetField.value)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fonts-modal { max-width: 820px; width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
.fonts-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.fonts-modal-header h3 { margin: 0; }
.close-btn { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { color: #fff; background: var(--bg-tertiary); }
.fonts-modal-controls { margin-bottom: 12px; }
.fonts-input-row { display: flex; gap: 10px; margin-bottom: 8px; }
.fonts-target-col { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
.fonts-cats { display: flex; gap: 5px; flex-wrap: wrap; }
.font-cat-btn { background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px; padding: 3px 10px; cursor: pointer; font-size: 11px; transition: all .15s; }
.font-cat-btn.active, .font-cat-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
.fonts-modal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; overflow-y: auto; flex: 1; padding-right: 4px; }
.font-mini-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 10px; transition: all .15s; }
.font-mini-card:hover { border-color: var(--accent); }
.font-mini-card.copied { border-color: #57f287; background: rgba(87,242,135,.05); }
.font-mini-preview { font-size: 15px; color: #dcddde; min-height: 36px; word-break: break-all; line-height: 1.4; margin-bottom: 6px; }
.font-mini-name { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
.font-mini-actions { display: flex; gap: 4px; }
.btn-icon { flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 5px; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 14px; text-align: center; transition: all .12s; }
.btn-icon:hover { color: #fff; border-color: var(--text-muted); }
.btn-icon.inject:hover { background: rgba(87,242,135,.2); border-color: #57f287; color: #57f287; }
.fonts-toast { text-align: center; background: #57f287; color: #000; font-weight: 700; padding: 6px 14px; border-radius: 8px; font-size: 13px; margin-top: 8px; }
</style>
