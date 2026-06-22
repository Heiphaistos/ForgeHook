<template>
  <Teleport to="body">
    <div v-if="modelValue" class="overlay" @click.self="$emit('update:modelValue', false)">
      <div class="modal">
        <div class="modal-header">
          <span>📤 Exporter l'embed</span>
          <button class="close-btn" @click="$emit('update:modelValue', false)">✕</button>
        </div>

        <div class="tabs">
          <button v-for="t in tabs" :key="t.id" :class="{ active: activeTab === t.id }" @click="activeTab = t.id">
            {{ t.label }}
          </button>
        </div>

        <div class="preview-area">
          <textarea readonly :value="output" spellcheck="false"></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn-copy" @click="copyToClipboard">
            {{ copied ? '✅ Copié !' : '📋 Copier' }}
          </button>
          <button class="btn-dl" @click="download">⬇️ Télécharger</button>
          <button class="btn-cancel" @click="$emit('update:modelValue', false)">Fermer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DiscordMessage } from '../../types/discord'
import { exportJSON, exportMarkdown, exportText, exportHTML, exportCurl, downloadFile } from '../../utils/exportEmbed'

const props = defineProps<{
  modelValue: boolean
  payload: DiscordMessage
  webhookUrl?: string
}>()

defineEmits<{ 'update:modelValue': [boolean] }>()

const activeTab = ref('json')
const copied = ref(false)

const tabs = [
  { id: 'json', label: 'JSON', ext: 'json', mime: 'application/json' },
  { id: 'md', label: 'Markdown', ext: 'md', mime: 'text/markdown' },
  { id: 'html', label: 'HTML', ext: 'html', mime: 'text/html' },
  { id: 'txt', label: 'Texte', ext: 'txt', mime: 'text/plain' },
  { id: 'curl', label: 'cURL', ext: 'sh', mime: 'text/plain' },
]

const output = computed(() => {
  const msg = props.payload
  switch (activeTab.value) {
    case 'json': return exportJSON(msg)
    case 'md': return exportMarkdown(msg)
    case 'html': return exportHTML(msg)
    case 'txt': return exportText(msg)
    case 'curl': return exportCurl(msg, props.webhookUrl ?? 'https://discord.com/api/webhooks/...')
    default: return ''
  }
})

async function copyToClipboard() {
  await navigator.clipboard.writeText(output.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function download() {
  const tab = tabs.find(t => t.id === activeTab.value)!
  downloadFile(output.value, `forgehook-embed.${tab.ext}`, tab.mime)
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex;
  align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: #2f3136; border-radius: 8px; width: 700px; max-width: 95vw;
  max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.modal-header {
  padding: 16px 20px; border-bottom: 1px solid #202225;
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 700; font-size: 16px; color: #fff;
}
.close-btn { background: none; border: none; color: #72767d; cursor: pointer; font-size: 18px; }
.close-btn:hover { color: #fff; }
.tabs {
  display: flex; gap: 2px; padding: 8px 12px;
  border-bottom: 1px solid #202225; flex-wrap: wrap;
}
.tabs button {
  padding: 6px 14px; border-radius: 4px; border: none;
  background: #36393f; color: #b9bbbe; cursor: pointer; font-size: 13px; font-weight: 600;
}
.tabs button.active { background: #5865f2; color: #fff; }
.tabs button:hover:not(.active) { background: #40444b; color: #dcddde; }
.preview-area { flex: 1; overflow: hidden; padding: 12px; }
.preview-area textarea {
  width: 100%; height: 100%; min-height: 320px; max-height: 50vh;
  background: #202225; color: #dcddde; border: 1px solid #40444b;
  border-radius: 4px; padding: 12px; font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 12px; line-height: 1.5; resize: vertical; box-sizing: border-box;
}
.modal-actions {
  display: flex; gap: 8px; padding: 12px 20px;
  border-top: 1px solid #202225; justify-content: flex-end;
}
.btn-copy { background: #5865f2; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
.btn-copy:hover { background: #4752c4; }
.btn-dl { background: #3ba55c; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
.btn-dl:hover { background: #2d7d46; }
.btn-cancel { background: #36393f; color: #dcddde; border: 1px solid #40444b; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.btn-cancel:hover { background: #40444b; }
</style>
